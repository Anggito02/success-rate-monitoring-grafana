import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import type { ApiResponse, SuccessRateEntry } from '@/types'
import * as XLSX from 'xlsx'

const requiredColumns = [
  'Tanggal Transaksi',
  'Jenis Transaksi',
  'RC',
  'RC Description',
  'total transaksi',
  'Total Nominal',
  'Total Biaya Admin',
  'Status Transaksi',
]

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('successRateFile') as File
    const selectedApplicationId = formData.get('selectedApplicationId') as string

    // Check if file was uploaded
    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: 'No file uploaded',
        } as ApiResponse,
        { status: 400 }
      )
    }

    // Validate application ID
    if (!selectedApplicationId || isNaN(parseInt(selectedApplicationId))) {
      return NextResponse.json(
        {
          success: false,
          message: 'Valid application selection is required',
        } as ApiResponse,
        { status: 400 }
      )
    }

    const applicationId = parseInt(selectedApplicationId)

    // Read file buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Parse Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' })

    if (workbook.SheetNames.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Excel file contains no worksheets',
        } as ApiResponse,
        { status: 400 }
      )
    }

    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]

    // Get headers from first row
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    const headers: string[] = []

    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
      const cell = worksheet[cellAddress]
      if (cell && cell.v) {
        headers.push(String(cell.v).trim())
      }
    }

    // Validate columns
    if (headers.length !== requiredColumns.length) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid column count. Expected ${requiredColumns.length} columns, got ${headers.length}. Required columns: ${requiredColumns.join(', ')}`,
        } as ApiResponse,
        { status: 400 }
      )
    }

    // Check required columns (case-insensitive)
    const normalizedHeaders = headers.map((h) => h.toLowerCase())
    const normalizedRequired = requiredColumns.map((r) => r.toLowerCase())

    const missingColumns = normalizedRequired.filter(
      (required) => !normalizedHeaders.includes(required)
    )

    if (missingColumns.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Missing required columns: ${missingColumns.join(', ')}`,
        } as ApiResponse,
        { status: 400 }
      )
    }

    // Find column indices
    const columnIndices: Record<string, number> = {}
    requiredColumns.forEach((colName) => {
      columnIndices[colName] = normalizedHeaders.indexOf(colName.toLowerCase())
    })

    // Collect data from rows (skip header row)
    const successRateData: SuccessRateEntry[] = []

    for (let rowNum = 1; rowNum <= range.e.r; rowNum++) {
      const rowData: Record<string, string> = {}

      // Get cell values for each required column
      requiredColumns.forEach((colName) => {
        const colIndex = columnIndices[colName]
        const cell = worksheet[XLSX.utils.encode_cell({ r: rowNum, c: colIndex })]
        const cellValue = cell && cell.v ? String(cell.v).trim() : ''
        rowData[colName] = cellValue
      })

      // Basic validation - skip completely empty rows
      const hasData = [
        'Tanggal Transaksi',
        'Jenis Transaksi',
        'RC',
        'Status Transaksi',
      ].some((col) => rowData[col] && rowData[col] !== '')

      if (!hasData) {
        continue
      }

      // Validate and format data
      let tanggalTransaksi: string | null = null
      let bulan: string | null = null
      let tahun: number | null = null

      const rawCell =
        worksheet[
          XLSX.utils.encode_cell({ r: rowNum, c: columnIndices['Tanggal Transaksi'] })
        ]

      if (rawCell) {
        let dateValue: Date | null = null

        // Excel date (type 'd') or numeric date (Excel serial number)
        if (rawCell.t === 'd') {
          dateValue = rawCell.v
        } else if (rawCell.t === 'n') {
          // Excel date serial number → convert to JS date
          const parsed = XLSX.SSF.parse_date_code(rawCell.v)
          if (parsed) {
            dateValue = new Date(parsed.y, parsed.m - 1, parsed.d)
          }
        } else {
          // Fallback for string date
          const dateStr = String(rawCell.v).trim()

          // Try DD/MM/YYYY format (Indonesian)
          const parts = dateStr.split('/')
          if (parts.length === 3) {
            const day = parseInt(parts[0])
            const month = parseInt(parts[1])
            const year = parseInt(parts[2])
            if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
              dateValue = new Date(year, month - 1, day)
            }
          }

          // Try YYYY-MM-DD format (ISO)
          if (!dateValue || isNaN(dateValue.getTime())) {
            const isoParts = dateStr.split('-')
            if (isoParts.length === 3) {
              const year = parseInt(isoParts[0])
              const month = parseInt(isoParts[1])
              const day = parseInt(isoParts[2])
              if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
                dateValue = new Date(year, month - 1, day)
              }
            }
          }

          if (!dateValue || isNaN(dateValue.getTime())) {
            dateValue = new Date(rawCell.v)
          }
        }

        if (dateValue && !isNaN(dateValue.getTime())) {
          const localYear = dateValue.getFullYear()
          const localMonth = dateValue.getMonth() + 1
          const localDay = dateValue.getDate()
          tanggalTransaksi = `${localYear}-${String(localMonth).padStart(2, '0')}-${String(localDay).padStart(2, '0')}`
          bulan = String(localMonth)
          tahun = localYear
        } else {
          console.warn(`Invalid date in row ${rowNum}:`, rawCell.v)
          continue
        }
      }

      let jenisTransaksi = rowData['Jenis Transaksi'] || null
      let rc = rowData['RC'] || null
      let rcDescription = rowData['RC Description'] || null

      // Validate Status Transaksi
      let statusTransaksi: 'sukses' | 'failed' | 'pending' | null = null
      const rawStatus = rowData['Status Transaksi']
      const normalizedStatus = rawStatus.toLowerCase()
      if (normalizedStatus === 'sukses' || rawStatus === 'Success') {
        statusTransaksi = 'sukses'
      } else if (
        normalizedStatus === 'failed' ||
        rawStatus === 'Failed' ||
        rawStatus === 'Gagal' ||
        rawStatus === 'Failure' ||
        rawStatus === 'gagal'
      ) {
        statusTransaksi = 'failed'
      } else if (normalizedStatus === 'pending' || rawStatus === 'Pending') {
        statusTransaksi = 'pending'
      }

      if (statusTransaksi === null) {
        continue
      }

      // Apply business rules for successful transactions
      if (statusTransaksi === 'sukses') {
        if (!rcDescription || rcDescription === '') {
          rcDescription = 'Success'
        }
        if (!rc || rc === '') {
          rc = '00'
        }
      }

      const totalTransaksi = rowData['total transaksi']
        ? parseInt(rowData['total transaksi'])
        : null
      const totalNominal = rowData['Total Nominal']
        ? parseFloat(rowData['Total Nominal'])
        : null
      const totalBiayaAdmin = rowData['Total Biaya Admin']
        ? parseFloat(rowData['Total Biaya Admin'])
        : null

      successRateData.push({
        tanggal_transaksi: tanggalTransaksi!,
        bulan: bulan!,
        tahun: tahun!,
        jenis_transaksi: jenisTransaksi,
        rc: rc,
        rc_description: rcDescription,
        total_transaksi: totalTransaksi,
        total_nominal: totalNominal,
        total_biaya_admin: totalBiayaAdmin,
        status_transaksi: statusTransaksi,
        error_type: null,
        id_app_identifier: applicationId,
      })
    }

    if (successRateData.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'No valid success rate data found in the file',
        } as ApiResponse,
        { status: 400 }
      )
    }

    // Insert data into database
    const connection = await pool.getConnection()
    try {
      // First, verify the application exists
      const [appResult]: any = await connection.execute(
        'SELECT app_name FROM app_identifier WHERE id = ?',
        [applicationId]
      )

      if (appResult.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: 'Selected application does not exist',
          } as ApiResponse,
          { status: 400 }
        )
      }

      const applicationName = appResult[0].app_name

      // Lookup error_type from response_code_dictionary for each entry
      // and apply new business logic rules
      for (const entry of successRateData) {
        let foundInDictionary = false

        // First, try to find error_type from dictionary
        if (entry.rc) {
          // Try to find error_type by exact match on jenis_transaksi and rc
          if (entry.jenis_transaksi) {
            const [dictionaryResult]: any = await connection.execute(
              'SELECT error_type FROM response_code_dictionary WHERE id_app_identifier = ? AND jenis_transaksi = ? AND rc = ?',
              [applicationId, entry.jenis_transaksi, entry.rc]
            )

            if (dictionaryResult.length > 0) {
              entry.error_type = dictionaryResult[0].error_type
              foundInDictionary = true
            }
          }

          // If no exact match, try lookup by rc only for this application
          if (!foundInDictionary) {
            const [rcOnlyResult]: any = await connection.execute(
              'SELECT error_type FROM response_code_dictionary WHERE id_app_identifier = ? AND rc = ? LIMIT 1',
              [applicationId, entry.rc]
            )

            if (rcOnlyResult.length > 0) {
              entry.error_type = rcOnlyResult[0].error_type
              foundInDictionary = true
            }
          }
        }

        // Apply new business logic if error_type is still null
        if (entry.error_type === null) {
          if (entry.status_transaksi === 'sukses') {
            // Rule 1: If status is sukses and error_type is null → Sukses
            entry.error_type = 'Sukses'
          } else if (entry.status_transaksi === 'failed') {
            // Rule 2: If status is failed and error_type is null
            if (!entry.rc || entry.rc === '' || entry.rc === null) {
              // If RC is null/empty → S
              entry.error_type = 'S'
            } else {
              // If RC exists
              if (entry.rc === '0' || entry.rc === '00') {
                // If RC is 0 or 00 → Sukses
                entry.error_type = 'Sukses'
              } else {
                // RC exists but not mapped → Insert into unmapped_rc
                // Use INSERT IGNORE to avoid duplicates
                await connection.execute(
                  `INSERT IGNORE INTO unmapped_rc 
                   (id_app_identifier, jenis_transaksi, rc, rc_description, status_transaksi, error_type)
                   VALUES (?, ?, ?, ?, ?, NULL)`,
                  [
                    applicationId,
                    entry.jenis_transaksi,
                    entry.rc,
                    entry.rc_description,
                    entry.status_transaksi
                  ]
                )
                // error_type remains null
              }
            }
          }
        }
      }

      // Insert data into app_success_rate table
      const insertQuery = `
        INSERT INTO app_success_rate (
          id_app_identifier, tanggal_transaksi, bulan, tahun, jenis_transaksi, rc, rc_description,
          total_transaksi, total_nominal, total_biaya_admin, status_transaksi, error_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `

      for (const entry of successRateData) {
        await connection.execute(insertQuery, [
          entry.id_app_identifier,
          entry.tanggal_transaksi,
          entry.bulan,
          entry.tahun,
          entry.jenis_transaksi,
          entry.rc,
          entry.rc_description,
          entry.total_transaksi,
          entry.total_nominal,
          entry.total_biaya_admin,
          entry.status_transaksi,
          entry.error_type,
        ])
      }

      return NextResponse.json({
        success: true,
        message: `Success rate document uploaded successfully. ${successRateData.length} entries processed.`,
        data: {
          entriesProcessed: successRateData.length,
          applicationId: applicationId,
          applicationName: applicationName,
        },
      } as ApiResponse)
    } finally {
      connection.release()
    }
  } catch (error: any) {
    console.error('Error uploading success rate:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Error processing success rate file: ' + error.message,
      } as ApiResponse,
      { status: 500 }
    )
  }
}

