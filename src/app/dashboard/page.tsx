'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

/* ── Types ── */
interface Item {
    id: number
    category_id: number
    name: string
    display_order: number
}

interface Category {
    id: number
    name: string
    display_order: number
    items: Item[]
}

type SelectionStatus = 'not_required' | 'maybe' | 'get_it' | null
type Selections = Record<number, SelectionStatus>

interface User {
    id: number
    username: string
    role: 'admin' | 'user'
}

interface Toast {
    id: number
    message: string
    type: 'success' | 'error'
}

/* ── Main Dashboard Component ── */
export default function DashboardPage() {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [restaurantName, setRestaurantName] = useState('Restaurant')
    const [categories, setCategories] = useState<Category[]>([])
    const [selections, setSelections] = useState<Selections>({})
    const [pendingSelections, setPendingSelections] = useState<Selections>({})
    const [openCategories, setOpenCategories] = useState<Set<number>>(new Set())
    const [editMode, setEditMode] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [toasts, setToasts] = useState<Toast[]>([])
    const [hasUnsaved, setHasUnsaved] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [newRestaurantName, setNewRestaurantName] = useState('')
    const toastIdRef = useRef(0)

    /* ── Toast helper ── */
    const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        const id = ++toastIdRef.current
        setToasts(t => [...t, { id, message, type }])
        setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000)
    }, [])

    /* ── Fetch initial data ── */
    const fetchAll = useCallback(async () => {
        try {
            const [meRes, settingsRes, catsRes, selRes] = await Promise.all([
                fetch('/api/auth/me'),
                fetch('/api/settings'),
                fetch('/api/categories'),
                fetch('/api/selections'),
            ])

            if (!meRes.ok) { router.push('/login'); return }

            const { user: u } = await meRes.json()
            setUser(u)

            const { restaurant } = await settingsRes.json()
            setRestaurantName(restaurant?.name || 'Restaurant')
            setNewRestaurantName(restaurant?.name || '')

            const { categories: cats } = await catsRes.json()
            setCategories(cats || [])
            // Open all categories by default
            setOpenCategories(new Set((cats || []).map((c: Category) => c.id)))

            const { selections: sels } = await selRes.json()
            setSelections(sels || {})
            setPendingSelections(sels || {})
        } catch {
            showToast('Failed to load data', 'error')
        } finally {
            setLoading(false)
        }
    }, [router, showToast])

    useEffect(() => { fetchAll() }, [fetchAll])

    /* ── Selection toggle ── */
    function toggleSelection(itemId: number, status: SelectionStatus) {
        setPendingSelections(prev => {
            const current = prev[itemId]
            const next = current === status ? null : status
            const updated = { ...prev, [itemId]: next }
            setHasUnsaved(true)
            return updated
        })
    }

    /* ── Save selections ── */
    async function saveSelections() {
        setSaving(true)
        try {
            const res = await fetch('/api/selections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ selections: pendingSelections }),
            })
            if (res.ok) {
                setSelections({ ...pendingSelections })
                setHasUnsaved(false)
                showToast('Selections saved!', 'success')
            } else {
                throw new Error('Save failed')
            }
        } catch {
            showToast('Failed to save', 'error')
        } finally {
            setSaving(false)
        }
    }

    /* ── Category collapse toggle ── */
    function toggleCategory(id: number) {
        setOpenCategories(prev => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }

    /* ── Edit mode: Add Category ── */
    const [newCatName, setNewCatName] = useState('')

    async function addCategory() {
        if (!newCatName.trim()) return
        try {
            const res = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newCatName.trim() }),
            })
            const data = await res.json()
            if (res.ok) {
                setCategories(prev => [...prev, data.category])
                setOpenCategories(prev => new Set([...prev, data.category.id]))
                setNewCatName('')
                showToast(`Category "${data.category.name}" added`, 'success')
            } else {
                showToast(data.error || 'Failed to add category', 'error')
            }
        } catch {
            showToast('Network error', 'error')
        }
    }

    /* ── Edit mode: Delete Category ── */
    async function deleteCategory(id: number, name: string) {
        if (!confirm(`Delete category "${name}" and all its items?`)) return
        try {
            await fetch(`/api/categories/${id}`, { method: 'DELETE' })
            setCategories(prev => prev.filter(c => c.id !== id))
            showToast(`Category deleted`, 'success')
        } catch {
            showToast('Failed to delete', 'error')
        }
    }

    /* ── Edit mode: Rename Category ── */
    async function renameCategory(id: number, name: string) {
        try {
            const res = await fetch(`/api/categories/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            })
            const data = await res.json()
            if (res.ok) {
                setCategories(prev => prev.map(c => c.id === id ? { ...c, name: data.category.name } : c))
                showToast('Category renamed', 'success')
            }
        } catch {
            showToast('Failed to rename', 'error')
        }
    }

    /* ── Edit mode: Add Item ── */
    async function addItem(categoryId: number, name: string) {
        if (!name.trim()) return
        try {
            const res = await fetch('/api/items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ categoryId, name: name.trim() }),
            })
            const data = await res.json()
            if (res.ok) {
                setCategories(prev => prev.map(c =>
                    c.id === categoryId ? { ...c, items: [...c.items, data.item] } : c
                ))
                showToast(`Item added`, 'success')
            } else {
                showToast(data.error || 'Failed to add item', 'error')
            }
        } catch {
            showToast('Network error', 'error')
        }
    }

    /* ── Edit mode: Delete Item ── */
    async function deleteItem(itemId: number, categoryId: number) {
        try {
            await fetch(`/api/items/${itemId}`, { method: 'DELETE' })
            setCategories(prev => prev.map(c =>
                c.id === categoryId ? { ...c, items: c.items.filter(i => i.id !== itemId) } : c
            ))
            showToast('Item deleted', 'success')
        } catch {
            showToast('Failed to delete', 'error')
        }
    }

    /* ── Edit mode: Rename Item ── */
    async function renameItem(itemId: number, categoryId: number, name: string) {
        try {
            const res = await fetch(`/api/items/${itemId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            })
            const data = await res.json()
            if (res.ok) {
                setCategories(prev => prev.map(c =>
                    c.id === categoryId
                        ? { ...c, items: c.items.map(i => i.id === itemId ? { ...i, name: data.item.name } : i) }
                        : c
                ))
                showToast('Item renamed', 'success')
            }
        } catch {
            showToast('Failed to rename', 'error')
        }
    }

    /* ── Save restaurant name ── */
    async function saveRestaurantName() {
        try {
            await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ restaurantName: newRestaurantName }),
            })
            setRestaurantName(newRestaurantName)
            setShowSettings(false)
            showToast('Restaurant name updated', 'success')
        } catch {
            showToast('Failed to save', 'error')
        }
    }

    /* ── PDF Export ── */
    async function exportPDF() {
        const { jsPDF } = await import('jspdf')
        const { default: autoTable } = await import('jspdf-autotable')

        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
        const now = new Date()
        const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
        const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        const fileDate = now.toISOString().slice(0, 16).replace('T', '_').replace(':', '-')

        // Header
        doc.setFontSize(20)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(30, 30, 30)
        doc.text(restaurantName, 15, 20)

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100, 100, 100)
        doc.text(`Inventory Report — ${dateStr} at ${timeStr}`, 15, 28)
        doc.text(`Generated by: ${user?.username || 'Unknown'}`, 15, 34)

        // Organize items by status
        const grouped: Record<string, Array<{ category: string; item: string }>> = {
            get_it: [],
            maybe: [],
            not_required: [],
            unselected: [],
        }

        for (const cat of categories) {
            for (const item of cat.items) {
                const status = pendingSelections[item.id] || null
                const entry = { category: cat.name, item: item.name }
                if (status === 'get_it') grouped.get_it.push(entry)
                else if (status === 'maybe') grouped.maybe.push(entry)
                else if (status === 'not_required') grouped.not_required.push(entry)
                else grouped.unselected.push(entry)
            }
        }

        const sections = [
            { key: 'get_it', label: '✓ Get It', color: [16, 185, 129] as [number, number, number] },
            { key: 'maybe', label: '? Maybe', color: [245, 158, 11] as [number, number, number] },
            { key: 'not_required', label: '✗ Not Required', color: [239, 68, 68] as [number, number, number] },
            { key: 'unselected', label: '— Unselected', color: [150, 150, 150] as [number, number, number] },
        ]

        let startY = 44

        for (const section of sections) {
            const rows = grouped[section.key]
            if (rows.length === 0) continue

            autoTable(doc, {
                startY,
                head: [[
                    { content: section.label, colSpan: 2, styles: { fillColor: section.color, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 11 } }
                ]],
                body: rows.map(r => [r.category, r.item]),
                columns: [
                    { header: 'Category', dataKey: 'category' },
                    { header: 'Item', dataKey: 'item' },
                ],
                headStyles: { fontSize: 11 },
                columnStyles: {
                    0: { cellWidth: 60, fontStyle: 'bold' },
                    1: { cellWidth: 'auto' },
                },
                alternateRowStyles: { fillColor: [248, 248, 250] },
                margin: { left: 15, right: 15 },
                styles: { fontSize: 9, cellPadding: 3 },
                didDrawPage: () => { /* page drawn */ },
            })

            // Update startY after each table
            startY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
        }

        // Footer on each page
        const pageCount = doc.getNumberOfPages()
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i)
            doc.setFontSize(8)
            doc.setTextColor(180, 180, 180)
            doc.text(`Page ${i} of ${pageCount} — ${restaurantName} Inventory`, 15, doc.internal.pageSize.height - 10)
        }

        doc.save(`inventory_${fileDate}.pdf`)
        showToast('PDF exported!', 'success')
    }

    /* ── Loading state ── */
    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
            </div>
        )
    }

    const isAdmin = user?.role === 'admin'

    return (
        <div className="dashboard">
            {/* ── Top Bar ── */}
            <header className="topbar">
                <div className="topbar-left">
                    <div className="topbar-icon">📦</div>
                    <span className="topbar-restaurant">{restaurantName}</span>
                    {isAdmin && (
                        <button
                            className="btn-icon btn"
                            style={{ width: 28, height: 28, fontSize: '0.8rem' }}
                            title="Edit restaurant name"
                            onClick={() => setShowSettings(true)}
                            id="open-settings"
                        >
                            ⚙
                        </button>
                    )}
                </div>

                <div className="topbar-right">
                    {/* Edit mode toggle — admin only */}
                    {isAdmin && (
                        <button
                            className={`edit-toggle ${editMode ? 'active' : ''}`}
                            onClick={() => setEditMode(v => !v)}
                            id="edit-mode-toggle"
                        >
                            <div className="toggle-switch" />
                            Edit Mode
                        </button>
                    )}

                    {/* User badge */}
                    <div className="user-badge">
                        <div className="user-avatar">{user?.username?.[0]?.toUpperCase()}</div>
                        <span className="user-name">{user?.username}</span>
                        <span className={`role-badge ${user?.role}`}>{user?.role}</span>
                    </div>

                    {/* Logout */}
                    <button
                        className="btn btn-ghost btn-sm"
                        id="logout-btn"
                        onClick={async () => {
                            await fetch('/api/auth/logout', { method: 'POST' })
                            router.push('/login')
                        }}
                    >
                        Sign out
                    </button>
                </div>
            </header>

            {/* ── Main Content ── */}
            <main className="dashboard-main">
                {/* Edit Mode Banner */}
                {editMode && (
                    <div className="edit-banner">
                        <span className="edit-banner-text">✏️ Edit mode is ON — you can add, rename, or delete categories and items</span>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditMode(false)}>
                            Exit Edit Mode
                        </button>
                    </div>
                )}

                {/* Add Category (edit mode) */}
                {editMode && (
                    <div className="add-category-row">
                        <input
                            id="new-category-input"
                            className="form-input"
                            placeholder="New category name…"
                            value={newCatName}
                            onChange={e => setNewCatName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addCategory()}
                        />
                        <button
                            id="add-category-btn"
                            className="btn btn-primary"
                            style={{ width: 'auto', padding: '0 1.25rem' }}
                            onClick={addCategory}
                            disabled={!newCatName.trim()}
                        >
                            + Add Category
                        </button>
                    </div>
                )}

                {/* Empty state */}
                {categories.length === 0 && !editMode && (
                    <div className="empty-state">
                        <div className="empty-state-icon">📋</div>
                        <div className="empty-state-title">No inventory yet</div>
                        <p className="empty-state-sub">
                            {isAdmin ? 'Switch to Edit Mode to add categories and items.' : 'The inventory is empty. Ask an admin to add items.'}
                        </p>
                    </div>
                )}

                {/* Categories */}
                {categories.map(cat => (
                    <CategoryCard
                        key={cat.id}
                        category={cat}
                        isOpen={openCategories.has(cat.id)}
                        editMode={editMode}
                        selections={pendingSelections}
                        onToggle={() => toggleCategory(cat.id)}
                        onSelectItem={toggleSelection}
                        onRenameCategory={renameCategory}
                        onDeleteCategory={deleteCategory}
                        onAddItem={addItem}
                        onRenameItem={renameItem}
                        onDeleteItem={deleteItem}
                    />
                ))}
            </main>

            {/* ── Save / Export Bar ── */}
            <div className="save-bar">
                <span className="save-bar-hint">
                    {hasUnsaved ? '⚠ You have unsaved changes' : 'All changes saved'}
                </span>
                <div className="save-bar-actions">
                    <button
                        id="export-pdf-btn"
                        className="btn-export"
                        onClick={exportPDF}
                    >
                        📄 Export PDF
                    </button>
                    <button
                        id="save-selections-btn"
                        className="btn-save"
                        onClick={saveSelections}
                        disabled={saving || !hasUnsaved}
                    >
                        {saving ? <span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> : null}
                        {saving ? 'Saving…' : '✓ Save'}
                    </button>
                </div>
            </div>

            {/* ── Settings Modal ── */}
            {showSettings && (
                <div className="modal-overlay" onClick={() => setShowSettings(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2 className="modal-title">⚙ Restaurant Settings</h2>
                        <div className="form-group">
                            <label className="form-label" htmlFor="restaurant-name-input">Restaurant Name</label>
                            <input
                                id="restaurant-name-input"
                                className="form-input"
                                value={newRestaurantName}
                                onChange={e => setNewRestaurantName(e.target.value)}
                                placeholder="Restaurant name"
                                autoFocus
                            />
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-ghost" onClick={() => setShowSettings(false)}>Cancel</button>
                            <button className="btn btn-primary" style={{ width: 'auto' }} onClick={saveRestaurantName} id="save-restaurant-name">
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Toasts ── */}
            {toasts.map(t => (
                <div key={t.id} className={`toast ${t.type}`}>{t.message}</div>
            ))}
        </div>
    )
}

/* ═══════════════════════════════════════
   CategoryCard Component
═══════════════════════════════════════ */
function CategoryCard({
    category,
    isOpen,
    editMode,
    selections,
    onToggle,
    onSelectItem,
    onRenameCategory,
    onDeleteCategory,
    onAddItem,
    onRenameItem,
    onDeleteItem,
}: {
    category: Category
    isOpen: boolean
    editMode: boolean
    selections: Selections
    onToggle: () => void
    onSelectItem: (itemId: number, status: SelectionStatus) => void
    onRenameCategory: (id: number, name: string) => void
    onDeleteCategory: (id: number, name: string) => void
    onAddItem: (categoryId: number, name: string) => void
    onRenameItem: (itemId: number, categoryId: number, name: string) => void
    onDeleteItem: (itemId: number, categoryId: number) => void
}) {
    const [editingName, setEditingName] = useState(false)
    const [nameInput, setNameInput] = useState(category.name)
    const [newItemName, setNewItemName] = useState('')

    function commitRenameCategory() {
        if (nameInput.trim() && nameInput.trim() !== category.name) {
            onRenameCategory(category.id, nameInput.trim())
        }
        setEditingName(false)
    }

    async function handleAddItem() {
        if (!newItemName.trim()) return
        await onAddItem(category.id, newItemName.trim())
        setNewItemName('')
    }

    return (
        <div className="category-card">
            {/* Header */}
            <div className="category-header" onClick={!editingName ? onToggle : undefined}>
                <span className={`category-chevron ${isOpen ? 'open' : ''}`}>▶</span>

                {editMode && editingName ? (
                    <input
                        className="inline-edit"
                        value={nameInput}
                        onChange={e => setNameInput(e.target.value)}
                        onBlur={commitRenameCategory}
                        onKeyDown={e => { if (e.key === 'Enter') commitRenameCategory(); if (e.key === 'Escape') setEditingName(false) }}
                        autoFocus
                        onClick={e => e.stopPropagation()}
                    />
                ) : (
                    <span className="category-name">{category.name}</span>
                )}

                <span className="category-count">{category.items.length} items</span>

                {editMode && !editingName && (
                    <div className="category-edit-actions" onClick={e => e.stopPropagation()}>
                        <button
                            className="btn btn-ghost btn-sm btn-icon"
                            title="Rename"
                            onClick={() => { setEditingName(true); setNameInput(category.name) }}
                        >
                            ✏
                        </button>
                        <button
                            className="btn btn-danger btn-sm"
                            onClick={() => onDeleteCategory(category.id, category.name)}
                            title="Delete category"
                        >
                            Delete
                        </button>
                    </div>
                )}
            </div>

            {/* Body */}
            {isOpen && (
                <div className="category-body">
                    {category.items.length === 0 && !editMode && (
                        <p style={{ color: 'var(--text-3)', fontSize: '0.85rem', padding: '0.5rem 0' }}>
                            No items in this category yet.
                        </p>
                    )}

                    {category.items.map(item => (
                        <ItemRow
                            key={item.id}
                            item={item}
                            categoryId={category.id}
                            editMode={editMode}
                            status={selections[item.id] || null}
                            onSelect={status => onSelectItem(item.id, status)}
                            onRename={(name) => onRenameItem(item.id, category.id, name)}
                            onDelete={() => onDeleteItem(item.id, category.id)}
                        />
                    ))}

                    {/* Add Item (edit mode) */}
                    {editMode && (
                        <div className="add-item-row">
                            <input
                                className="form-input"
                                placeholder="New item name…"
                                value={newItemName}
                                onChange={e => setNewItemName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddItem()}
                            />
                            <button
                                className="btn btn-ghost btn-sm"
                                style={{ whiteSpace: 'nowrap' }}
                                onClick={handleAddItem}
                                disabled={!newItemName.trim()}
                            >
                                + Add Item
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

/* ═══════════════════════════════════════
   ItemRow Component
═══════════════════════════════════════ */
function ItemRow({
    item,
    categoryId,
    editMode,
    status,
    onSelect,
    onRename,
    onDelete,
}: {
    item: Item
    categoryId: number
    editMode: boolean
    status: SelectionStatus
    onSelect: (status: SelectionStatus) => void
    onRename: (name: string) => void
    onDelete: () => void
}) {
    const [editingName, setEditingName] = useState(false)
    const [nameInput, setNameInput] = useState(item.name)
    // We use categoryId only to satisfy TS — it's available for future use
    void categoryId

    function commitRename() {
        if (nameInput.trim() && nameInput.trim() !== item.name) {
            onRename(nameInput.trim())
        }
        setEditingName(false)
    }

    if (editMode && editingName) {
        return (
            <div className="item-row">
                <div className="item-dot" />
                <input
                    className="inline-edit"
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditingName(false) }}
                    autoFocus
                />
                <button className="btn btn-ghost btn-sm" onClick={commitRename}>✓</button>
            </div>
        )
    }

    return (
        <div className="item-row">
            <div className="item-dot" />
            <span className="item-name">{item.name}</span>

            {/* Options — only shown in view mode */}
            {!editMode && (
                <div className="item-options">
                    <button
                        className={`option-btn not-required ${status === 'not_required' ? 'selected' : ''}`}
                        onClick={() => onSelect('not_required')}
                        title="Not Required"
                    >
                        Not Required
                    </button>
                    <button
                        className={`option-btn maybe ${status === 'maybe' ? 'selected' : ''}`}
                        onClick={() => onSelect('maybe')}
                        title="Maybe"
                    >
                        Maybe
                    </button>
                    <button
                        className={`option-btn get-it ${status === 'get_it' ? 'selected' : ''}`}
                        onClick={() => onSelect('get_it')}
                        title="Get It"
                    >
                        Get It
                    </button>
                </div>
            )}

            {/* Edit actions */}
            {editMode && (
                <div className="item-edit-actions">
                    <button
                        className="btn btn-ghost btn-sm btn-icon"
                        title="Rename"
                        onClick={() => { setEditingName(true); setNameInput(item.name) }}
                    >
                        ✏
                    </button>
                    <button
                        className="btn btn-danger btn-sm"
                        onClick={onDelete}
                        title="Delete item"
                    >
                        Del
                    </button>
                </div>
            )}
        </div>
    )
}
