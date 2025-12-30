import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import type { ApiResponse } from '@/types'

// POST - Submit mapping for an unmapped RC
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, id_app_identifier, jenis_transaksi, rc, error_type } = body

    // Validate required fields
    if (!id || !id_app_identifier || !rc || !error_type) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields: id, id_app_identifier, rc, error_type',
        } as ApiResponse,
        { status: 400 }
      )
    }

    // Validate error_type value
    if (!['S', 'N', 'Sukses'].includes(error_type)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid error_type. Must be S, N, or Sukses',
        } as ApiResponse,
        { status: 400 }
      )
    }

    const connection = await pool.getConnection()
    try {
      // Start transaction
      await connection.beginTransaction()

      // 1. Insert into response_code_dictionary
      await connection.execute(
        `INSERT INTO response_code_dictionary (id_app_identifier, jenis_transaksi, rc, error_type)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE error_type = VALUES(error_type)`,
        [id_app_identifier, jenis_transaksi || '', rc, error_type]
      )

      // 2. Update all app_success_rate entries that match this RC
      // Build query based on whether jenis_transaksi is provided
      let updateQuery: string
      let updateParams: any[]
      
      if (jenis_transaksi && jenis_transaksi !== '') {
        // If jenis_transaksi is provided, match it specifically
        updateQuery = `UPDATE app_success_rate 
         SET error_type = ?
         WHERE id_app_identifier = ? 
         AND rc = ? 
         AND jenis_transaksi = ?
         AND error_type IS NULL`
        updateParams = [error_type, id_app_identifier, rc, jenis_transaksi]
      } else {
        // If jenis_transaksi is not provided, update all RCs regardless of jenis_transaksi
        updateQuery = `UPDATE app_success_rate 
         SET error_type = ?
         WHERE id_app_identifier = ? 
         AND rc = ?
         AND error_type IS NULL`
        updateParams = [error_type, id_app_identifier, rc]
      }
      
      await connection.execute(updateQuery, updateParams)

      // 3. Delete from unmapped_rc
      await connection.execute(
        `DELETE FROM unmapped_rc WHERE id = ?`,
        [id]
      )

      // Commit transaction
      await connection.commit()

      return NextResponse.json({
        success: true,
        message: `RC mapping added successfully. RC ${rc} mapped to ${error_type}`,
      } as ApiResponse)
    } catch (error) {
      // Rollback on error
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error: any) {
    console.error('Error submitting RC mapping:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Error submitting RC mapping: ' + error.message,
      } as ApiResponse,
      { status: 500 }
    )
  }
}
