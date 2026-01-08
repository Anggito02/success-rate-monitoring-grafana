'use client'

import { useState, useEffect, useCallback } from 'react'
import type { SuccessRateEntry, Application } from '@/types'

export default function NoRcTransactionCard() {
  const [transactions, setTransactions] = useState<SuccessRateEntry[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [selectedAppId, setSelectedAppId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())
  const [editingRc, setEditingRc] = useState<Record<number, string>>({})
  const [editingRcDescription, setEditingRcDescription] = useState<Record<number, string>>({})
  const [bulkRc, setBulkRc] = useState<string>('')
  const [bulkRcDescription, setBulkRcDescription] = useState<string>('')
  const [submitting, setSubmitting] = useState<number | null>(null)
  const [submittingAll, setSubmittingAll] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const limit = 25

  const loadApplications = async () => {
    try {
      const response = await fetch('/api/applications')
      const result = await response.json()

      if (result.success) {
        setApplications(result.data)
      }
    } catch (err: any) {
      console.error('Error loading applications:', err)
    }
  }

  const loadTransactions = useCallback(async (page: number) => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', limit.toString())
      if (selectedAppId) {
        params.append('appId', selectedAppId)
      }

      const response = await fetch(`/api/no-rc-transaction?${params.toString()}`)
      const result = await response.json()

      if (result.success) {
        setTransactions(result.data)
        setTotalPages(result.pagination?.totalPages || 1)
        setTotalCount(result.pagination?.total || 0)
        // Reset selections when data reloads
        setSelectedItems(new Set())
        setEditingRc({})
        setEditingRcDescription({})
      } else {
        throw new Error(result.message || 'Failed to load no RC transactions')
      }
    } catch (err: any) {
      setError(err.message)
      console.error('Error loading no RC transactions:', err)
    } finally {
      setIsLoading(false)
    }
  }, [selectedAppId, limit])

  useEffect(() => {
    loadApplications()
  }, [])

  useEffect(() => {
    loadTransactions(currentPage)
  }, [currentPage, loadTransactions])

  useEffect(() => {
    // Reset to page 1 when filter changes
    setCurrentPage(1)
  }, [selectedAppId])

  useEffect(() => {
    // Listen for data changes
    const handleDataChange = () => {
      loadTransactions(currentPage)
    }

    window.addEventListener('successRateUploaded', handleDataChange)
    window.addEventListener('appAdded', handleDataChange)

    return () => {
      window.removeEventListener('successRateUploaded', handleDataChange)
      window.removeEventListener('appAdded', handleDataChange)
    }
  }, [currentPage, loadTransactions])

  const handleSelectItem = (id: number) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedItems.size === transactions.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(transactions.map(t => t.id!)))
    }
  }

  const handleRcChange = (id: number, value: string) => {
    setEditingRc(prev => ({
      ...prev,
      [id]: value
    }))
  }

  const handleRcDescriptionChange = (id: number, value: string) => {
    setEditingRcDescription(prev => ({
      ...prev,
      [id]: value
    }))
  }

  const handleSubmit = async (transaction: SuccessRateEntry) => {
    const id = transaction.id!
    const rc = editingRc[id]?.trim() || ''
    const rcDescription = editingRcDescription[id]?.trim() || ''

    if (!rc || rc === '') {
      setMessage({ text: 'RC is required', type: 'error' })
      return
    }

    try {
      setSubmitting(id)
      setMessage(null)

      const response = await fetch('/api/no-rc-transaction/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          rc,
          rc_description: rcDescription || null,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setMessage({ text: result.message || 'RC assigned successfully', type: 'success' })
        // Remove from local state (will be filtered out on next load)
        setTransactions(prev => prev.filter(t => t.id !== id))
        // Clear editing state
        setEditingRc(prev => {
          const newState = { ...prev }
          delete newState[id]
          return newState
        })
        setEditingRcDescription(prev => {
          const newState = { ...prev }
          delete newState[id]
          return newState
        })
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('noRcTransactionSubmitted'))
      } else {
        throw new Error(result.message || 'Failed to assign RC')
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' })
    } finally {
      setSubmitting(null)
    }
  }

  const handleSubmitAll = async () => {
    const itemsToSubmit = transactions.filter(t => 
      selectedItems.has(t.id!) && bulkRc.trim() !== ''
    )

    if (itemsToSubmit.length === 0) {
      setMessage({ text: 'Please select at least one transaction and provide RC', type: 'error' })
      return
    }

    try {
      setSubmittingAll(true)
      setMessage(null)

      const mappings = itemsToSubmit.map(t => ({
        id: t.id!,
        rc: bulkRc.trim(),
        rc_description: bulkRcDescription.trim() || null,
      }))

      const response = await fetch('/api/no-rc-transaction/submit-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mappings }),
      })

      const result = await response.json()

      if (result.success) {
        setMessage({ 
          text: result.message || `Successfully assigned RC to ${itemsToSubmit.length} transaction(s)`, 
          type: 'success' 
        })
        // Remove submitted items from local state
        const submittedIds = new Set(itemsToSubmit.map(t => t.id!))
        setTransactions(prev => prev.filter(item => !submittedIds.has(item.id!)))
        // Clear selections and bulk inputs
        setSelectedItems(new Set())
        setBulkRc('')
        setBulkRcDescription('')
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('noRcTransactionSubmitted'))
      } else {
        throw new Error(result.message || 'Failed to assign RCs')
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' })
    } finally {
      setSubmittingAll(false)
    }
  }

  return (
    <div className="glass-card rounded-xl p-3 md:p-4 h-full flex flex-col transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl border border-white/20">
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-2">
        <div className="w-8 h-8 rounded-md bg-gradient-to-br from-orange-600 to-orange-800 flex items-center justify-center shadow-md flex-shrink-0">
          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="min-w-0">
          <h2 className="text-sm md:text-base font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent truncate">
            No RC Transaction
          </h2>
          <p className="text-xs text-gray-500">Transactions without RC</p>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-2">
        <select
          value={selectedAppId}
          onChange={(e) => setSelectedAppId(e.target.value)}
          className="w-full px-2.5 py-1.5 border-2 border-gray-200 rounded-md text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-200 transition-all bg-white/80 backdrop-blur-sm"
        >
          <option value="">All Applications</option>
          {applications.map((app) => (
            <option key={app.id} value={app.id}>
              {app.app_name}
            </option>
          ))}
        </select>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-2 p-2 rounded-md text-xs font-medium shadow-md transform transition-all animate-slide-in ${
            message.type === 'success'
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border border-green-200'
              : 'bg-gradient-to-r from-red-50 to-rose-50 text-red-800 border border-red-200'
          }`}
        >
          <div className="flex gap-1.5 items-center">
            {message.type === 'success' ? (
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <span className="flex-1 truncate">{message.text}</span>
          </div>
        </div>
      )}

      {/* Bulk Update Section */}
      {selectedItems.size > 0 && (
        <div className="mb-2 p-2 bg-orange-50 border border-orange-200 rounded-md">
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={selectedItems.size === transactions.length}
              onChange={handleSelectAll}
              className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
            />
            <span className="text-xs font-semibold text-orange-800">
              {selectedItems.size} selected - Bulk Update
            </span>
          </div>
          <div className="space-y-1.5">
            <input
              type="text"
              placeholder="RC (required)"
              value={bulkRc}
              onChange={(e) => setBulkRc(e.target.value)}
              className="w-full px-2 py-1 text-xs border border-orange-300 rounded focus:outline-none focus:border-orange-500"
            />
            <input
              type="text"
              placeholder="RC Description (optional)"
              value={bulkRcDescription}
              onChange={(e) => setBulkRcDescription(e.target.value)}
              className="w-full px-2 py-1 text-xs border border-orange-300 rounded focus:outline-none focus:border-orange-500"
            />
            <button
              onClick={handleSubmitAll}
              disabled={submittingAll || bulkRc.trim() === ''}
              className="w-full px-2 py-1 text-xs font-semibold bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submittingAll ? 'Updating...' : `Update All (${selectedItems.size})`}
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <svg className="animate-spin h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : error ? (
          <div className="text-red-600 text-xs p-2">{error}</div>
        ) : transactions.length === 0 ? (
          <div className="text-gray-500 text-xs p-2 text-center">No transactions without RC found</div>
        ) : (
          <div className="space-y-1">
            {transactions.map((transaction) => {
              const id = transaction.id!
              const isSelected = selectedItems.has(id)
              const rcValue = editingRc[id] ?? ''
              const rcDescValue = editingRcDescription[id] ?? ''

              return (
                <div
                  key={id}
                  className="p-2 bg-white/50 rounded border border-gray-200 hover:border-orange-300 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectItem(id)}
                      className="mt-1 w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <div>
                          <span className="font-semibold text-gray-700">Date:</span>{' '}
                          <span className="text-gray-600">{transaction.tanggal_transaksi}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">Type:</span>{' '}
                          <span className="text-gray-600">{transaction.jenis_transaksi}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">Status:</span>{' '}
                          <span className="text-gray-600">{transaction.status_transaksi || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">Total:</span>{' '}
                          <span className="text-gray-600">{transaction.total_transaksi || 0}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <input
                          type="text"
                          placeholder="RC (required)"
                          value={rcValue}
                          onChange={(e) => handleRcChange(id, e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:border-orange-500"
                        />
                        <input
                          type="text"
                          placeholder="RC Description (optional)"
                          value={rcDescValue}
                          onChange={(e) => handleRcDescriptionChange(id, e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:border-orange-500"
                        />
                        <button
                          onClick={() => handleSubmit(transaction)}
                          disabled={submitting === id || rcValue.trim() === ''}
                          className="w-full px-2 py-1 text-xs font-semibold bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submitting === id ? 'Updating...' : 'Update RC'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && !error && transactions.length > 0 && (
        <div className="mt-2 flex items-center justify-between text-xs">
          <div className="text-gray-600">
            Page {currentPage} of {totalPages} ({totalCount} total)
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

