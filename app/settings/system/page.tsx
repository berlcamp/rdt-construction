'use client'
import TopBar from '@/components/TopBar'
import { Sidebar, SettingsSideBar, Title } from '@/components'
import { useSupabase } from '@/context/SupabaseProvider'
import React, { useEffect, useState } from 'react'
import SelectUserNames from './SelectUserNames'
import { useFilter } from '@/context/FilterContext'

import type { settingsDataTypes } from '@/types'

const Page: React.FC = () => {
  const { supabase } = useSupabase()
  const [settingsData, setSettingsData] = useState<settingsDataTypes[] | []>([])
  const [results, setResults] = useState(false)
  const [settingsId, setSettingsId] = useState(null)
  const { setToast } = useFilter()
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (saving) return

    setSaving(true)

    let query = supabase
      .from('system_settings')

    if (settingsId) {
      query = query.upsert({ id: settingsId, type: 'system_access', data: settingsData })
    } else {
      query = query.insert({ type: 'system_access', org_id: process.env.NEXT_PUBLIC_ORG_ID, data: settingsData })
    }
    query = query.select()

    const { error } = await query

    if (error) {
      console.error(error)
    } else {
      // pop up the success message
      setToast('success', 'Successfully saved.')
    }

    setSaving(false)
  }

  const handleManagerChange = (newdata: any, type: string) => {
    const tempSettings = Array.isArray(settingsData) ? settingsData.filter((item: settingsDataTypes) => item.access_type !== type) : []
    const updatedSettings: settingsDataTypes[] = [...tempSettings, { access_type: type, data: newdata }]
    setSettingsData(updatedSettings)
  }

  const fetchData = async () => {
    const { data: res, error } = await supabase
      .from('system_settings')
      .select()
      .eq('type', 'system_access')
      .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)
      .limit(1)
      .single()

    if (error) console.error(error)

    if (res) {
      setResults(true)
      setSettingsData(res.data)
      setSettingsId(res.id)
    }
  }

  useEffect(() => {
    void fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <Sidebar>
        <SettingsSideBar/>
      </Sidebar>
      <TopBar/>
      <div className="app__main">
        <div>
            <div className='app__title'>
              <Title title='System Permissions'/>
            </div>

            <div className='app__content'>
              {
                results && (
                  <>
                  <SelectUserNames handleManagerChange={handleManagerChange} multiple={true} type='settings' settingsData={Array.isArray(settingsData) ? settingsData.filter((item: settingsDataTypes) => item.access_type === 'settings') : []} title='Who can manage System Settings'/>
                  <SelectUserNames handleManagerChange={handleManagerChange} multiple={true} type='employee_accounts' settingsData={Array.isArray(settingsData) ? settingsData.filter((item: settingsDataTypes) => item.access_type === 'employee_accounts') : []} title='Who can manage Employee Accounts'/>
                  <SelectUserNames handleManagerChange={handleManagerChange} multiple={true} type='payroll' settingsData={Array.isArray(settingsData) ? settingsData.filter((item: settingsDataTypes) => item.access_type === 'payroll') : []} title='Who can manage Payroll System'/>
                  <SelectUserNames handleManagerChange={handleManagerChange} multiple={true} type='inventory' settingsData={Array.isArray(settingsData) ? settingsData.filter((item: settingsDataTypes) => item.access_type === 'inventory') : []} title='Who can manage Inventory System'/>
                  <SelectUserNames handleManagerChange={handleManagerChange} multiple={true} type='purchase_orders' settingsData={Array.isArray(settingsData) ? settingsData.filter((item: settingsDataTypes) => item.access_type === 'purchase_orders') : []} title='Who can manage Purchanse Orders'/>
                  <SelectUserNames handleManagerChange={handleManagerChange} multiple={true} type='projects' settingsData={Array.isArray(settingsData) ? settingsData.filter((item: settingsDataTypes) => item.access_type === 'projects') : []} title='Who can manage Projects'/>
                  </>
                )
              }
              <button
                onClick={handleSave}
                className="flex items-center bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 font-medium px-2 py-1 text-sm text-white rounded-sm">
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>

        </div>
      </div>
    </>
  )
}
export default Page