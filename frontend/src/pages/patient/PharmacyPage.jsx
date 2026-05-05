// PharmacyPage.jsx - patient/PharmacyPage.jsx
import { useState, useEffect } from 'react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { PageLoader, Modal, EmptyState } from '../../components/common/index'
import { pharmacyAPI, prescriptionAPI } from '../../services/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function PharmacyPage() {
  const [pharmacies, setPharmacies] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [orderModal, setOrderModal] = useState(false)
  const [orderForm, setOrderForm] = useState({ prescriptionId: '', pharmacyName: '', pharmacyAddress: '', pharmacyPhone: '', deliveryType: 'pickup', deliveryAddress: '' })
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('pharmacies')

  useEffect(() => {
    Promise.all([pharmacyAPI.getPharmacies(), prescriptionAPI.getMyPrescriptions({ limit: 50 }), pharmacyAPI.getMyOrders()])
      .then(([pharmRes, presRes, ordersRes]) => {
        setPharmacies(pharmRes.data.data.pharmacies || [])
        setPrescriptions((presRes.data.data.prescriptions || []).filter(p => !p.isDispensed))
        setOrders(ordersRes.data.data.orders || [])
      })
      .catch(() => toast.error('Failed to load pharmacy data'))
      .finally(() => setLoading(false))
  }, [])

  const handleOrder = async () => {
    if (!orderForm.prescriptionId) return toast.error('Please select a prescription')
    if (!orderForm.pharmacyName) return toast.error('Please select a pharmacy')
    setSubmitting(true)
    try {
      await pharmacyAPI.placeOrder({ prescriptionId: orderForm.prescriptionId, pharmacy: { name: orderForm.pharmacyName, address: orderForm.pharmacyAddress, phone: orderForm.pharmacyPhone }, deliveryType: orderForm.deliveryType, deliveryAddress: orderForm.deliveryAddress })
      toast.success('Order placed successfully!')
      setOrderModal(false)
      pharmacyAPI.getMyOrders().then(({ data }) => setOrders(data.data.orders || []))
    } catch { toast.error('Failed to place order') }
    finally { setSubmitting(false) }
  }

  const statusColors = { pending: 'bg-amber-100 text-amber-700', processing: 'bg-blue-100 text-blue-700', ready: 'bg-green-100 text-green-700', delivered: 'bg-secondary-100 text-secondary-700', cancelled: 'bg-red-100 text-red-700' }

  if (loading) return <DashboardLayout title="Pharmacy"><PageLoader /></DashboardLayout>

  return (
    <DashboardLayout title="Pharmacy">
      <div className="flex gap-1 mb-6 bg-secondary-100 dark:bg-secondary-800 p-1 rounded-xl w-fit">
        {[['pharmacies', 'Pharmacies'], ['orders', `My Orders (${orders.length})`]].map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)} className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === id ? 'bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white shadow-sm' : 'text-secondary-500 hover:text-secondary-700'}`}>{label}</button>
        ))}
      </div>

      {activeTab === 'pharmacies' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-secondary-500 text-sm">{pharmacies.length} nearby pharmacies</p>
            <button onClick={() => setOrderModal(true)} className="btn-primary">Order Medicines</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pharmacies.map(p => (
              <div key={p.id} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-secondary-900 dark:text-white">{p.name}</h3>
                    <p className="text-secondary-500 text-sm mt-0.5">📍 {p.address}</p>
                    <p className="text-secondary-500 text-sm">📞 {p.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-amber-400">{'★'.repeat(Math.round(p.rating))}{'☆'.repeat(5 - Math.round(p.rating))}</p>
                    <p className="text-xs text-secondary-400">{p.rating}/5</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  {p.deliveryAvailable
                    ? <span className="badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">🚚 Delivery available</span>
                    : <span className="badge bg-secondary-100 text-secondary-600 dark:bg-secondary-700 dark:text-secondary-400">🏪 Pickup only</span>
                  }
                  <button onClick={() => { setOrderForm(prev => ({ ...prev, pharmacyName: p.name, pharmacyAddress: p.address, pharmacyPhone: p.phone })); setOrderModal(true) }} className="btn-secondary text-xs py-1.5 px-3">Order Here</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div>
          {orders.length === 0 ? (
            <EmptyState icon="💊" title="No orders yet" description="Order medicines from your prescriptions" action={<button onClick={() => setOrderModal(true)} className="btn-primary mt-2">Place an Order</button>} />
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order._id} className="card p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-secondary-900 dark:text-white">Order #{order.orderNumber}</p>
                      <p className="text-sm text-secondary-500">{order.pharmacy?.name} • {format(new Date(order.createdAt), 'MMM d, yyyy')}</p>
                    </div>
                    <span className={`badge ${statusColors[order.status] || 'bg-secondary-100 text-secondary-600'}`}>{order.status}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {order.medicines?.map((med, i) => (
                      <span key={i} className="px-2.5 py-1 bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 rounded-lg text-xs font-medium">{med.name}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-secondary-100 dark:border-secondary-700 text-sm text-secondary-500">
                    <span>📦 {order.deliveryType}</span>
                    {order.totalAmount && <span className="font-bold text-secondary-900 dark:text-white">${order.totalAmount}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal isOpen={orderModal} onClose={() => setOrderModal(false)} title="Order Medicines" size="md">
        <div className="space-y-4">
          <div>
            <label className="label">Select Prescription</label>
            <select className="input" value={orderForm.prescriptionId} onChange={e => setOrderForm(p => ({ ...p, prescriptionId: e.target.value }))}>
              <option value="">Choose prescription...</option>
              {prescriptions.map(p => <option key={p._id} value={p._id}>{p.prescriptionNumber} — {p.diagnosis}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Pharmacy</label>
            <select className="input" value={orderForm.pharmacyName} onChange={e => { const ph = pharmacies.find(p => p.name === e.target.value); if (ph) setOrderForm(prev => ({ ...prev, pharmacyName: ph.name, pharmacyAddress: ph.address, pharmacyPhone: ph.phone })) }}>
              <option value="">Select pharmacy...</option>
              {pharmacies.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Delivery Type</label>
            <div className="grid grid-cols-2 gap-3">
              {['pickup', 'delivery'].map(type => (
                <button type="button" key={type} onClick={() => setOrderForm(p => ({ ...p, deliveryType: type }))} className={`py-2.5 rounded-xl border-2 text-sm font-semibold capitalize transition-all ${orderForm.deliveryType === type ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-600' : 'border-secondary-200 dark:border-secondary-600 text-secondary-600 dark:text-secondary-400'}`}>{type === 'pickup' ? '🏪 Pickup' : '🚚 Delivery'}</button>
              ))}
            </div>
          </div>
          {orderForm.deliveryType === 'delivery' && (
            <div>
              <label className="label">Delivery Address</label>
              <input className="input" placeholder="Full delivery address..." value={orderForm.deliveryAddress} onChange={e => setOrderForm(p => ({ ...p, deliveryAddress: e.target.value }))} />
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => setOrderModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleOrder} disabled={submitting} className="btn-primary flex-1">{submitting ? 'Placing...' : 'Place Order'}</button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
