import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useFilter } from '@/context/FilterContext'
import { CustomButton, OneColLayoutLoading } from '@/components'

// Types
import type { ProductTypes, PurchaseOrderItemTypes } from '@/types'

// Redux imports
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { useSupabase } from '@/context/SupabaseProvider'
import { fetchProducts } from '@/utils/fetchApi'

interface ModalProps {
  hideModal: () => void
  editData: PurchaseOrderItemTypes | null
  purchaseOrderId: string
}

const AddEditModal = ({ hideModal, editData, purchaseOrderId }: ModalProps) => {
  const { setToast } = useFilter()
  const { supabase, session } = useSupabase()

  const [saving, setSaving] = useState(false)
  const [products, setProducts] = useState<ProductTypes[] | []>([])

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const dispatch = useDispatch()

  const { register, formState: { errors }, reset, handleSubmit } = useForm<PurchaseOrderItemTypes>({
    mode: 'onSubmit'
  })

  const onSubmit = async (formdata: PurchaseOrderItemTypes) => {
    if (saving) return

    setSaving(true)

    if (editData) {
      void handleUpdate(formdata)
    } else {
      void handleCreate(formdata)
    }
  }

  const handleCreate = async (formdata: PurchaseOrderItemTypes) => {
    try {
      const newData = {
        product_id: formdata.product_id,
        quantity: formdata.quantity,
        purchase_order_id: purchaseOrderId,
        price: formdata.price,
        total: Number(formdata.quantity) * Number(formdata.price)
      }

      const { data, error } = await supabase
        .from('rdt_purchase_order_items')
        .insert(newData)
        .select()

      if (error) throw new Error(error.message)

      const prod = products.find((p: ProductTypes) => p.id.toString() === formdata.product_id)

      // add to logs
      const { error: logError } = await supabase
        .from('rdt_remarks')
        .insert({
          reference_id: purchaseOrderId,
          type: 'purchase_order',
          reply_type: 'system',
          message: `Added product "${prod ? prod.name : ''}"`,
          sender_id: session.user.id
        })
      if (logError) throw new Error(logError.message)

      // Append new data in redux
      const updatedData = { ...newData, rdt_products: prod, id: data[0].id }
      dispatch(updateList([updatedData, ...globallist]))

      // pop up the success message
      setToast('success', 'Successfully saved.')

      setSaving(false)

      // hide the modal
      hideModal()

      // reset all form fields
      reset()
    } catch (e) {
      console.error(e)
    }
  }

  const handleUpdate = async (formdata: PurchaseOrderItemTypes) => {
    if (!editData) return

    const newData = {
      product_id: formdata.product_id,
      quantity: formdata.quantity,
      price: formdata.price,
      total: Number(formdata.quantity) * Number(formdata.price)
    }

    try {
      const { error } = await supabase
        .from('rdt_purchase_order_items')
        .update(newData)
        .eq('id', editData.id)

      if (error) throw new Error(error.message)

      const prod = products.find((p: ProductTypes) => p.id.toString() === formdata.product_id)

      // add to logs
      const { error: logError } = await supabase
        .from('rdt_remarks')
        .insert({
          reference_id: purchaseOrderId,
          type: 'purchase_order',
          reply_type: 'system',
          message: `Updated product "${prod ? prod.name : ''}"`,
          sender_id: session.user.id
        })
      if (logError) throw new Error(logError.message)

      // Update data in redux
      const items = [...globallist]
      const updatedData = { ...newData, rdt_products: prod, id: editData.id }
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
    } catch (e) {
      console.error(e)
    }
  }

  // manually set the defaultValues of use-form-hook whenever the component receives new props.
  useEffect(() => {
    // fetch products
    const fetchProductsData = async () => {
      const result = await fetchProducts({ filterStatus: 'Active' }, 9999, 0)
      setProducts(result.data)

      reset({
        product_id: editData ? editData.product_id : '',
        quantity: editData ? editData.quantity : '',
        price: editData ? editData.price : ''
      })
    }
    void fetchProductsData()
  }, [editData, reset])

  return (
  <>
    <div className="app__modal_wrapper">
      <div className="app__modal_wrapper2">
        <div className="app__modal_wrapper3">
          <div className="app__modal_header">
            <h5 className="app__modal_header_text">
              Item Details
            </h5>
            <button disabled={saving} onClick={hideModal} type="button" className="app__modal_header_btn">&times;</button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="app__modal_body">
            {
              !saving
                ? <>
                    <div className='app__form_field_container'>
                      <div className='w-full'>
                        <div className='app__label_standard'>Product Name/Description</div>
                        <div>
                          <select
                            {...register('product_id', { required: true })}
                            className='app__select_standard'>
                              <option value=''>Choose Product</option>
                              {
                                products.map((item: ProductTypes, index: number) => (
                                  <option key={index} value={item.id}>{item.name}</option>
                                ))
                              }
                          </select>
                          {errors.product_id && <div className='app__error_message'>Product is required</div>}
                        </div>
                      </div>
                    </div>
                    <div className='app__form_field_container'>
                      <div className='w-full'>
                        <div className='app__label_standard'>Quantity</div>
                        <div>
                          <input
                            {...register('quantity', { required: true })}
                            type='text'
                            placeholder='Quantity'
                            className='app__select_standard'/>
                          {errors.quantity && <div className='app__error_message'>Quantity is required</div>}
                        </div>
                      </div>
                    </div>
                    <div className='app__form_field_container'>
                      <div className='w-full'>
                        <div className='app__label_standard'>Unit Price</div>
                        <div>
                          <input
                            {...register('price', { required: true })}
                            type='number'
                            step='any'
                            placeholder='Price'
                            className='app__select_standard'/>
                          {errors.price && <div className='app__error_message'>Unit Price is required</div>}
                        </div>
                      </div>
                    </div>
                    <div className='py-4'>
                      <hr/>
                    </div>
                  </>
                : <OneColLayoutLoading rows={3}/>
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
