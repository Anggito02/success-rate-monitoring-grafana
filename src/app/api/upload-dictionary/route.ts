import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import type { ApiResponse } from '@/types'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('dictionaryFile') as File
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
    if (headers.length !== 3) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid column count. Expected 3 columns, got ${headers.length}`,
        } as ApiResponse,
        { status: 400 }
      )
    }

    // Check required columns (case-insensitive)
    const normalizedHeaders = headers.map((h) => h.toLowerCase())
    const requiredColumns = ['jenis transaksi', 'rc', 's/n']

    const missingColumns = requiredColumns.filter(
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
    const jenisTransaksiIndex = normalizedHeaders.indexOf('jenis transaksi')
    const rcIndex = normalizedHeaders.indexOf('rc')
    const snIndex = normalizedHeaders.indexOf('s/n')

    // Collect data from rows (skip header row)
    const dictionaryData: Array<{
      jenis_transaksi: string
      rc: string
      error_type: 'S' | 'N' | 'Sukses'
    }> = []

    for (let rowNum = 1; rowNum <= range.e.r; rowNum++) {
      const jenisTransaksiCell =
        worksheet[XLSX.utils.encode_cell({ r: rowNum, c: jenisTransaksiIndex })]
      const rcCell = worksheet[XLSX.utils.encode_cell({ r: rowNum, c: rcIndex })]
      const snCell = worksheet[XLSX.utils.encode_cell({ r: rowNum, c: snIndex })]

      const jenisTransaksi =
        jenisTransaksiCell && jenisTransaksiCell.v
          ? String(jenisTransaksiCell.v).trim()
          : ''
      const rc = rcCell && rcCell.v ? String(rcCell.v).trim() : ''
      const rawSn =
        snCell && snCell.v ? String(snCell.v).trim().toUpperCase() : ''

      // Map S/N values to error_type
      let errorType: 'S' | 'N' | 'Sukses' | null = null
      if (rawSn === 'S') {
        errorType = 'S'
      } else if (rawSn === 'N') {
        errorType = 'N'
      } else if (
        rawSn === 'SUKSES' ||
        rawSn === 'SUCCESS' ||
        rawSn === 'BERHASIL'
      ) {
        errorType = 'Sukses'
      }

      // Validate row data - skip if missing error_type
      if (!errorType) {
        continue
      }

      dictionaryData.push({
        jenis_transaksi: jenisTransaksi,
        rc: rc,
        error_type: errorType,
      })
    }

    if (dictionaryData.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'No valid dictionary data found in the file',
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

      // Use INSERT IGNORE or ON DUPLICATE KEY UPDATE to handle duplicates
      const insertQuery = `
        INSERT INTO response_code_dictionary (id_app_identifier, jenis_transaksi, rc, error_type)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        error_type = VALUES(error_type)
      `

      for (const entry of dictionaryData) {
        await connection.execute(insertQuery, [
          applicationId,
          entry.jenis_transaksi,
          entry.rc,
          entry.error_type,
        ])
      }

      return NextResponse.json({
        success: true,
        message: `Dictionary uploaded successfully. ${dictionaryData.length} entries processed.`,
        data: {
          entriesProcessed: dictionaryData.length,
          applicationId: applicationId,
          applicationName: applicationName,
        },
      } as ApiResponse)
    } finally {
      connection.release()
    }
  } catch (error: any) {
    console.error('Error uploading dictionary:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Error processing dictionary file: ' + error.message,
      } as ApiResponse,
      { status: 500 }
    )
  }
}

