import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useFilter } from '@/context/FilterContext'
import { CustomButton, OneColLayoutLoading } from '@/components'

// Types
import type { FixedDeductionTypes } from '@/types'

// Redux imports
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { useSupabase } from '@/context/SupabaseProvider'

interface ModalProps {
  hideModal: () => void
  editData: FixedDeductionTypes | null
}

const AddEditModal = ({ hideModal, editData }: ModalProps) => {
  const { setToast } = useFilter()
  const { supabase } = useSupabase()
  const [saving, setSaving] = useState(false)

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const { register, formState: { errors }, reset, handleSubmit } = useForm<FixedDeductionTypes>({
    mode: 'onSubmit'
  })

  const onSubmit = async (formdata: FixedDeductionTypes) => {
    if (saving) return

    setSaving(true)

    if (editData) {
      void handleUpdate(formdata)
    } else {
      void handleCreate(formdata)
    }
  }

  const handleCreate = async (formdata: FixedDeductionTypes) => {
    try {
      const newData = {
        name: formdata.name,
        amount: formdata.amount,
        org_id: process.env.NEXT_PUBLIC_ORG_ID
      }

      const { data, error: error2 } = await supabase
        .from('rdt_fixed_deductions')
        .insert(newData)
        .select()

      if (error2) throw new Error(error2.message)

      // Append new data in redux
      const updatedData = { ...newData, id: data[0].id }
      dispatch(updateList([updatedData, ...globallist]))

      // pop up the success message
      setToast('success', 'Successfully saved.')

      // Updating showing text in redux
      dispatch(updateResultCounter({ showing: Number(resultsCounter.showing) + 1, results: Number(resultsCounter.results) + 1 }))

      setSaving(false)

      // hide the modal
      hideModal()

      // reset all form fields
      reset()
    } catch (e) {
      console.error(e)
    }
  }

  const handleUpdate = async (formdata: FixedDeductionTypes) => {
    if (!editData) return

    const newData = {
      name: formdata.name,
      amount: formdata.amount
    }

    try {
      const { error } = await supabase
        .from('rdt_fixed_deductions')
        .update(newData)
        .eq('id', editData.id)

      if (error) throw new Error(error.message)
    } catch (e) {
      console.error(e)
    } finally {
      // Update data in redux
      const items = [...globallist]
      const updatedData = { ...newData, id: editData.id }
      const foundIndex = items.findIndex(x => x.id === updatedData.id)
      items[foundIndex] = { ...items[foundIndex], ...updatedData }
      dispatch(updateList(items))

      // pop up the success message
      setToast('success', 'Successfully saved.')

      setSaving(false)

      // hide the modal
      hideModal()

      // reset all form fields
      reset()
    }
  }

  // manually set the defaultValues of use-form-hook whenever the component receives new props.
  useEffect(() => {
    reset({
      name: editData ? editData.name : '',
      amount: editData ? editData.amount : ''
    })
  }, [editData, reset])

  return (
  <>
    <div className="app__modal_wrapper">
      <div className="app__modal_wrapper2">
        <div className="app__modal_wrapper3">
          <div className="app__modal_header">
            <h5 className="app__modal_header_text">
              Deduction Details
            </h5>
            <button disabled={saving} onClick={hideModal} type="button" className="app__modal_header_btn">&times;</button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="app__modal_body">
            {
              !saving
                ? <>
                    <div className='app__form_field_container'>
                      <div className='w-full'>
                        <div className='app__label_standard'>Description</div>
                        <div>
                          <input
                            {...register('name', { required: true })}
                            type='text'
                            placeholder='Description'
                            className='app__select_standard'/>
                          {errors.name && <div className='app__error_message'>Description is required</div>}
                        </div>
                      </div>
                    </div>
                    <div className='app__form_field_container'>
                      <div className='w-full'>
                        <div className='app__label_standard'>Amount</div>
                        <div>
                          <input
                            {...register('amount', { required: true })}
                            type='number'
                            step='any'
                            className='app__select_standard'/>
                          {errors.amount && <div className='app__error_message'>Amount is required</div>}
                        </div>
                      </div>
                    </div>
                  </>
                : <OneColLayoutLoading rows={2}/>
            }
            <div className="app__modal_footer">
                  <CustomButton
                    btnType='submit'
                    isDisabled={saving}
                    title={saving ? 'Saving...' : 'Submit'}
                    containerStyles="app__btn_green"
                  />
            </div>
          </form>
        </div>
      </div>
    </div>
  </>
  )
}

export default AddEditModal
