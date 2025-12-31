import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import type { ApiResponse } from '@/types'

// PATCH - Update dictionary entry error_type
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, error_type } = body

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

    if (!error_type || !['S', 'N', 'Sukses'].includes(error_type)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Valid error_type (S, N, or Sukses) is required',
        } as ApiResponse,
        { status: 400 }
      )
    }

    const connection = await pool.getConnection()
    try {
      // First, verify the dictionary entry exists
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

      // Update the dictionary entry
      await connection.execute(
        'UPDATE response_code_dictionary SET error_type = ? WHERE id = ?',
        [error_type, id]
      )

      // Also update all app_success_rate entries that match this dictionary entry
      // and have NULL error_type
      await connection.execute(
        `UPDATE app_success_rate 
         SET error_type = ? 
         WHERE id_app_identifier = ? 
           AND jenis_transaksi = ? 
           AND rc = ? 
           AND error_type IS NULL`,
        [error_type, entry.id_app_identifier, entry.jenis_transaksi, entry.rc]
      )

      return NextResponse.json({
        success: true,
        message: 'Dictionary entry updated successfully',
        data: {
          id,
          error_type,
        },
      } as ApiResponse)
    } finally {
      connection.release()
    }
  } catch (error: any) {
    console.error('Error updating dictionary:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Error updating dictionary entry: ' + error.message,
      } as ApiResponse,
      { status: 500 }
    )
  }
}

