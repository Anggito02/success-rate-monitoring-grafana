import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import type { ApiResponse, Application } from '@/types'

// GET - Fetch all applications
export async function GET() {
  try {
    const [rows] = await pool.execute(
      'SELECT id, app_name FROM app_identifier ORDER BY app_name'
    )
    
    return NextResponse.json({
      success: true,
      data: rows,
    } as ApiResponse<Application[]>)
  } catch (error: any) {
    console.error('Error fetching applications:', error.message)
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      } as ApiResponse,
      { status: 500 }
    )
  }
}

// POST - Add new application
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { appName } = body

    if (!appName || !appName.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: 'Application name is required',
        } as ApiResponse,
        { status: 400 }
      )
    }

    const [result]: any = await pool.execute(
      'INSERT INTO app_identifier (app_name) VALUES (?)',
      [appName.trim()]
    )

    return NextResponse.json({
      success: true,
      message: 'Application added successfully',
      data: {
        id: result.insertId,
        appName: appName.trim(),
      },
    } as ApiResponse)
  } catch (error: any) {
    console.error('Error adding application:', error.message)

    // Check for duplicate entry
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        {
          success: false,
          message: 'Application name already exists',
        } as ApiResponse,
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      } as ApiResponse,
      { status: 500 }
    )
  }
}

