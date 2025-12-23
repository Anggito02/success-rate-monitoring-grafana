import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import type { ApiResponse, UnmappedRC } from '@/types'

// GET - List all unmapped RCs
export async function GET() {
  try {
    const connection = await pool.getConnection()
    try {
      const [rows]: any = await connection.execute(`
        SELECT 
          u.id,
          u.id_app_identifier,
          a.app_name,
          u.jenis_transaksi,
          u.rc,
          u.rc_description,
          u.status_transaksi,
          u.error_type,
          u.created_at
        FROM unmapped_rc u
        LEFT JOIN app_identifier a ON u.id_app_identifier = a.id
        ORDER BY u.created_at DESC
      `)

      return NextResponse.json({
        success: true,
        data: rows as UnmappedRC[],
      } as ApiResponse<UnmappedRC[]>)
    } finally {
      connection.release()
    }
  } catch (error: any) {
    console.error('Error fetching unmapped RCs:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Error fetching unmapped RCs: ' + error.message,
      } as ApiResponse,
      { status: 500 }
    )
  }
}

