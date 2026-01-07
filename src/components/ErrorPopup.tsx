'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface SkippedRow {
  rowNumber: number
  reason: string
}

interface ErrorPopupProps {
  isOpen: boolean
  onClose: () => void
  skippedRows: SkippedRow[]
  totalSkipped: number
  totalProcessed: number
}

export default function ErrorPopup({
  isOpen,
  onClose,
  skippedRows,
  totalSkipped,
  totalProcessed,
}: ErrorPopupProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  // Use portal to render outside of card hierarchy
  const popupContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-rose-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                Upload Gagal - Row dengan Error Ditemukan
              </h2>
              <p className="text-sm text-gray-600">
                {totalSkipped} row di-skip, {totalProcessed} row berhasil diproses
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 font-medium">
              ⚠️ Upload dibatalkan. Silakan perbaiki error pada row berikut sebelum mengupload ulang.
            </p>
          </div>

          <div className="space-y-2">
            {skippedRows.map((row, index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-red-600">
                      {row.rowNumber}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 mb-1">
                      Row {row.rowNumber}
                    </p>
                    <p className="text-sm text-gray-600 break-words">
                      {row.reason}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )

  // Render portal to document.body to ensure it appears above all content
  if (typeof window !== 'undefined') {
    return createPortal(popupContent, document.body)
  }

  return null
}

