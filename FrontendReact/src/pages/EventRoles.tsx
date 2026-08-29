import { useState, useEffect } from 'react'
import api from '@/services/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Shield, Plus, Pencil, Trash, X, Check, ChevronDown, ChevronRight } from 'lucide-react'
import BackButton from '@/components/BackButton'

type RoleGroups = Record<string, string[]>

export default function EventRoles() {
  const [groups, setGroups] = useState<RoleGroups>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [newGroupName, setNewGroupName] = useState('')
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)
  const [editingGroup, setEditingGroup] = useState<string | null>(null)
  const [editingGroupName, setEditingGroupName] = useState('')

  const [addingSubTo, setAddingSubTo] = useState<string | null>(null)
  const [newSubRole, setNewSubRole] = useState('')
  const [editingSubKey, setEditingSubKey] = useState<string | null>(null)
  const [editingSubValue, setEditingSubValue] = useState('')

  useEffect(() => {
    api.get('/settings/role-groups')
      .then((res) => setGroups(res.data))
      .catch((err) => console.error("API Error:", err))
      .finally(() => setLoading(false))
  }, [])

  const saveGroups = async (updated: RoleGroups) => {
    setSaving(true)
    try {
      await api.put('/settings/role-groups', updated)
      setGroups(updated)
    } catch {} finally {
      setSaving(false)
    }
  }

  const handleAddGroup = () => {
    const name = newGroupName.trim()
    if (!name || groups[name]) return
    saveGroups({ ...groups, [name]: [] })
    setNewGroupName('')
    setExpandedGroup(name)
  }

  const handleDeleteGroup = (name: string) => {
    const updated = { ...groups }
    delete updated[name]
    saveGroups(updated)
    if (expandedGroup === name) setExpandedGroup(null)
  }

  const handleRenameGroup = (oldName: string) => {
    const newName = editingGroupName.trim()
    if (!newName || (newName !== oldName && groups[newName])) return
    const updated = { ...groups }
    const subs = updated[oldName] || []
    delete updated[oldName]
    updated[newName] = subs
    saveGroups(updated)
    setEditingGroup(null)
    if (expandedGroup === oldName) setExpandedGroup(newName)
  }

  const handleAddSubRole = (groupName: string) => {
    const name = newSubRole.trim()
    if (!name) return
    const subs = groups[groupName] || []
    if (subs.includes(name)) return
    saveGroups({ ...groups, [groupName]: [...subs, name] })
    setNewSubRole('')
    setAddingSubTo(null)
  }

  const handleDeleteSubRole = (groupName: string, subIndex: number) => {
    const subs = [...(groups[groupName] || [])]
    subs.splice(subIndex, 1)
    saveGroups({ ...groups, [groupName]: subs })
  }

  const handleRenameSubRole = (groupName: string, subIndex: number) => {
    const val = editingSubValue.trim()
    if (!val) return
    const subs = [...(groups[groupName] || [])]
    subs[subIndex] = val
    saveGroups({ ...groups, [groupName]: subs })
    setEditingSubKey(null)
  }

  return (
    <div>
      <BackButton to="/dashboard" />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-2">
          <Shield className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Rols d'Esdeveniment</h1>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Carregant rols...</p>
        ) : (
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Grups de rols</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Organitza els rols per grups. Cada grup pot tenir rols específics a dins (ex: "Geganter" → "1r portador", "2n portador"...).
              </p>

              <div className="flex gap-2">
                <Input
                  placeholder="Nom del nou grup..."
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddGroup()}
                />
                <Button onClick={handleAddGroup} disabled={!newGroupName.trim() || saving} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {Object.entries(groups).map(([groupName, subs]) => {
                  const isExpanded = expandedGroup === groupName
                  const isEditing = editingGroup === groupName
                  return (
                    <div key={groupName} className="rounded-lg border">
                      <div className="flex items-center gap-2 px-3 py-2">
                        <button
                          onClick={() => setExpandedGroup(isExpanded ? null : groupName)}
                          className="shrink-0"
                        >
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>

                        {isEditing ? (
                          <>
                            <Input
                              value={editingGroupName}
                              onChange={(e) => setEditingGroupName(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleRenameGroup(groupName)}
                              className="flex-1 h-8"
                              autoFocus
                            />
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-green-600" onClick={() => handleRenameGroup(groupName)}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditingGroup(null)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <span className="flex-1 text-sm font-semibold">{groupName}</span>
                            <span className="text-xs text-muted-foreground">{subs.length} sub-rols</span>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => { setEditingGroup(groupName); setEditingGroupName(groupName) }}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600" onClick={() => handleDeleteGroup(groupName)}>
                              <Trash className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>

                      {isExpanded && (
                        <div className="border-t px-3 py-2 space-y-1.5">
                          {subs.map((sub, idx) => {
                            const subKey = `${groupName}:${idx}`
                            return (
                              <div key={subKey} className="flex items-center gap-2 pl-6">
                                {editingSubKey === subKey ? (
                                  <>
                                    <Input
                                      value={editingSubValue}
                                      onChange={(e) => setEditingSubValue(e.target.value)}
                                      onKeyDown={(e) => e.key === 'Enter' && handleRenameSubRole(groupName, idx)}
                                      className="flex-1 h-7 text-xs"
                                      autoFocus
                                    />
                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-600" onClick={() => handleRenameSubRole(groupName, idx)}>
                                      <Check className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingSubKey(null)}>
                                      <X className="h-3.5 w-3.5" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <span className="flex-1 text-xs">{sub}</span>
                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditingSubKey(subKey); setEditingSubValue(sub) }}>
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-600" onClick={() => handleDeleteSubRole(groupName, idx)}>
                                      <Trash className="h-3 w-3" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            )
                          })}

                          {addingSubTo === groupName ? (
                            <div className="flex items-center gap-2 pl-6 pt-1">
                              <Input
                                value={newSubRole}
                                onChange={(e) => setNewSubRole(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddSubRole(groupName)}
                                placeholder="Nom del sub-rol..."
                                className="flex-1 h-7 text-xs"
                                autoFocus
                              />
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-600" onClick={() => handleAddSubRole(groupName)}>
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setAddingSubTo(null); setNewSubRole('') }}>
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-muted-foreground ml-6"
                              onClick={() => { setAddingSubTo(groupName); setNewSubRole('') }}
                            >
                              <Plus className="mr-1 h-3 w-3" /> Afegir sub-rol
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {Object.keys(groups).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No hi ha cap grup definit.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
