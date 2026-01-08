import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import type { ApiResponse } from '@/types'

export async function POST() {
  try {
    const connection = await pool.getConnection()

    try {
      // Update app_success_rate table ENUM
      await connection.execute(`
        ALTER TABLE app_success_rate 
        MODIFY COLUMN status_transaksi ENUM('sukses', 'failed', 'pending', 'suspect', 'cancelled')
      `)

      // Update unmapped_rc table ENUM
      await connection.execute(`
        ALTER TABLE unmapped_rc 
        MODIFY COLUMN status_transaksi ENUM('sukses', 'failed', 'pending', 'suspect', 'cancelled')
      `)

      console.log('✅ Database schema migrated successfully!')
      
      return NextResponse.json({
        success: true,
        message: 'Database schema migrated successfully. ENUM status_transaksi has been updated to include "suspect" and "cancelled".',
      } as ApiResponse)
    } catch (error: any) {
      console.error('Error migrating database schema:', error.message)
      
      // If column doesn't exist or already has the correct ENUM, that's okay
      if (error.code === 'ER_BAD_FIELD_ERROR' || error.message.includes('Duplicate enum')) {
        return NextResponse.json({
          success: true,
          message: 'Schema is already up to date or migration is not needed.',
        } as ApiResponse)
      }
      
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        } as ApiResponse,
        { status: 500 }
      )
    } finally {
      connection.release()
    }
  } catch (error: any) {
    console.error('Error migrating database schema:', error.message)
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      } as ApiResponse,
      { status: 500 }
    )
  }
}

