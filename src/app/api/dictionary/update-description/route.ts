import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import type { ApiResponse } from '@/types'

// PATCH - Update dictionary entry rc_description (single)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, rc_description } = body

    // Validate input
    if (!id || typeof id !== 'number') {
      return NextResponse.json(
        {
          success: false,
          message: 'Valid dictionary entry ID is required',
        } as ApiResponse,
        { status: 400 }
      )
    }

    if (rc_description === undefined || rc_description === null) {
      return NextResponse.json(
        {
          success: false,
          message: 'rc_description is required',
        } as ApiResponse,
        { status: 400 }
      )
    }

    const connection = await pool.getConnection()
    try {
      // First, verify the dictionary entry exists and get its details
      const [entryResult]: any = await connection.execute(
        'SELECT id_app_identifier, jenis_transaksi, rc FROM response_code_dictionary WHERE id = ?',
        [id]
      )

      if (entryResult.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: 'Dictionary entry not found',
          } as ApiResponse,
          { status: 404 }
        )
      }

      const entry = entryResult[0]

      // Update rc_description in app_success_rate table for matching entries
      // Build query based on whether jenis_transaksi is provided
      let updateQuery: string
      let updateParams: any[]
      
      if (entry.jenis_transaksi && entry.jenis_transaksi !== '') {
        updateQuery = `UPDATE app_success_rate 
         SET rc_description = ?
         WHERE id_app_identifier = ? 
           AND rc = ? 
           AND jenis_transaksi = ?`
        updateParams = [rc_description || null, entry.id_app_identifier, entry.rc, entry.jenis_transaksi]
      } else {
        updateQuery = `UPDATE app_success_rate 
         SET rc_description = ?
         WHERE id_app_identifier = ? 
           AND rc = ?`
        updateParams = [rc_description || null, entry.id_app_identifier, entry.rc]
      }
      
      const [updateResult]: any = await connection.execute(updateQuery, updateParams)

      return NextResponse.json({
        success: true,
        message: 'RC description updated successfully',
        data: {
          id,
          rc_description: rc_description || null,
          affectedRows: updateResult.affectedRows,
        },
      } as ApiResponse)
    } finally {
      connection.release()
    }
  } catch (error: any) {
    console.error('Error updating RC description:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Error updating RC description: ' + error.message,
      } as ApiResponse,
      { status: 500 }
    )
  }
}

