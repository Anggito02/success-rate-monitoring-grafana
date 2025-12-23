export interface Application {
  id: number
  app_name: string
  created_at?: Date
  updated_at?: Date
}

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
}

export interface DictionaryEntry {
  jenis_transaksi: string
  rc: string
  error_type: 'S' | 'N' | 'Sukses'
}

export interface SuccessRateEntry {
  tanggal_transaksi: string
  bulan: string
  tahun: number
  jenis_transaksi: string | null
  rc: string | null
  rc_description: string | null
  total_transaksi: number | null
  total_nominal: number | null
  total_biaya_admin: number | null
  status_transaksi: 'sukses' | 'failed' | 'pending'
  error_type: 'S' | 'N' | 'Sukses' | null
  id_app_identifier: number
}

