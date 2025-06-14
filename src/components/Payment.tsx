import React, { useEffect, useState } from 'react';
import { loadScript } from '../lib/utils';
import Modal from './Modal';

const plans = [
  {
    name: 'Free',
    price: 0,
    features: [
      'Unlimited journal entries',
      'Basic analytics',
      'Light & dark mode',
      'Export to PDF',
    ],
  },
  {
    name: 'Starter',
    price: 19,
    features: [
      'All Free features',
      'Priority email support',
      'Daily mood tracking',
      'Reminders & notifications',
      'Custom tags & search',
    ],
  },
  {
    name: 'Pro',
    price: 49,
    features: [
      'All Starter features',
      'Advanced analytics',
      'Collaboration tools',
      'Cloud backup',
      'Mobile app integration',
    ],
  },
];

declare global {
  interface ImportMeta {
    env: {
      VITE_RAZORPAY_KEY_ID: string;
    };
  }
  interface Window {
    Razorpay: any;
  }
}

interface PaymentPlansProps {
  showPricingModal: boolean;
  setShowPricingModal: (show: boolean) => void;
}

const PaymentPlans: React.FC<PaymentPlansProps> = ({ showPricingModal, setShowPricingModal }) => {
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);

  useEffect(() => {
    const initializeRazorpay = async () => {
      try {
        await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      } catch (error) {
        console.error('Razorpay SDK failed to load');
      }
    };
    initializeRazorpay();
  }, []);

  // Reset selected plan when modal closes
  useEffect(() => {
    if (!showPricingModal) {
      setSelectedPlan(null);
    }
  }, [showPricingModal]);

  const handlePlanSelection = (plan: typeof plans[0]) => {
    if (plan.price > 0) {
      setSelectedPlan(plan);
      setShowPricingModal(true);
    }
  };

  const handlePayment = async (amount: number) => {
    try {
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: amount * 100,
        currency: 'INR',
        name: 'Reflecto Daily Journaling',
        description: 'Premium Journal Subscription',
        image: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg',
        handler: function (response: any) {
          alert('Payment Success! ' + JSON.stringify(response));
          setShowPricingModal(false);
        },
        prefill: {
          name: 'User Name',
          email: 'user@example.com',
          contact: '9999999999'
        },
        theme: {
          color: '#7c3aed'
        },
        modal: {
          escape: true
        },
        method: {
          upi: true,
          netbanking: false,
          card: true,
          wallet: false,
          paylater: false
        }
      };
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      alert('Payment failed to initialize');
    }
  };

  return (
    <div className="flex flex-col items-center my-8">
      <h2 className="text-2xl font-serif font-bold mb-6 text-[var(--color-accent)]" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>Choose Your Plan</h2>
      <div className="flex flex-col md:flex-row gap-6">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`entry-card flex flex-col items-center w-72 border-l-4 ${
              plan.price === 0
                ? 'border-[var(--color-accent)]'
                : plan.price === 100
                ? 'border-[var(--color-accent)]'
                : 'border-[var(--color-accent)]'
            }`}
          >
            <h3 className="text-xl font-serif font-semibold mb-1 text-[var(--color-accent)]" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>{plan.name}</h3>
            <p className="text-[var(--color-muted)] mb-4">
              {plan.price === 0
                ? 'For personal use'
                : plan.name === 'Starter'
                ? 'For regular users'
                : 'For professionals'}
            </p>
            <div className="text-3xl font-bold mb-2 text-[var(--color-text-light)] dark:text-[var(--color-text-dark)]">
              {plan.price === 0 ? 'Free' : `$${plan.price}`}
              <span className="text-base font-normal text-[var(--color-muted)]"> /month</span>
            </div>
            <ul className="text-left mb-6 space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <span className="text-[var(--color-accent)]">✔</span>
                  <span className="text-[var(--color-text-light)] dark:text-[var(--color-text-dark)]">{feature}</span>
                </li>
              ))}
            </ul>
            {plan.price > 0 ? (
              <button
                className="w-full py-2 rounded-xl font-bold border bg-[var(--color-accent)] text-white hover:opacity-90 transition"
                onClick={() => handlePlanSelection(plan)}
              >
                Get started
              </button>
            ) : (
              <span className="text-[var(--color-muted)] font-semibold">Current Plan</span>
            )}
          </div>
        ))}
      </div>

      {/* Pricing Modal */}
      <Modal isOpen={showPricingModal} onClose={() => setShowPricingModal(false)}>
        {selectedPlan && (
          <div className="diary-page text-center max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-2 font-serif text-[var(--color-accent)]" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>{selectedPlan.name} Plan</h2>
            <p className="mb-4 text-lg font-semibold text-[var(--color-text-light)] dark:text-[var(--color-text-dark)]">
              {selectedPlan.price === 0
                ? 'Free forever!'
                : `Get access for just ₹${selectedPlan.price}/month!`}
            </p>
            <ul className="text-left mb-6 space-y-2">
              {selectedPlan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <span className="text-[var(--color-accent)]">✔</span>
                  <span className="text-[var(--color-text-light)] dark:text-[var(--color-text-dark)]">{feature}</span>
                </li>
              ))}
            </ul>
            {selectedPlan.price > 0 && (
              <button
                onClick={() => handlePayment(selectedPlan.price)}
                className="w-full py-2 rounded-xl font-bold border bg-[var(--color-accent)] text-white hover:opacity-90 transition"
              >
                Pay Now
              </button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PaymentPlans; 