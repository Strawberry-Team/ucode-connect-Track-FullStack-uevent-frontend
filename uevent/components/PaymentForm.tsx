// src/components/PaymentForm.tsx
import React, { useState } from 'react';
import {
  useStripe,
  useElements,
  PaymentElement,
} from '@stripe/react-stripe-js';
import { StripePaymentElementOptions } from '@stripe/stripe-js';
import { useRouter } from 'next/router';

interface PaymentFormProps {
  orderId: number;
  clientSecret: string; // Получаем как prop
}

const PaymentForm: React.FC<PaymentFormProps> = ({ orderId, clientSecret }) => {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      console.log('Stripe.js has not loaded yet.');
      setIsLoading(false); // Останавливаем загрузку, если Stripe не готов
      setErrorMessage("Payment system is not ready. Please wait a moment and try again.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    console.log(`Attempting to confirm payment for order ${orderId}`);

    // Шаг 5 -> 6: Вызов confirmPayment
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // URL, куда Stripe вернет пользователя после 3DS (или других действий)
        return_url: `http://localhost:5173/orders/confirmation/${orderId}`,
      },
      redirect: 'if_required', // Поведение по умолчанию
    });

    // Этот код выполнится ТОЛЬКО если НЕ было редиректа (ошибка или редкий успех без 3DS)
    if (error) {
      // Ошибки валидации карты, отклонения банком (без 3DS), проблемы сети и т.д.
      console.error('Stripe confirmPayment error:', error);
      setErrorMessage(error.message || 'An unexpected payment error occurred.');
      setIsLoading(false); // Позволяем пользователю попробовать снова
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Очень редкий случай для confirmPayment с redirect: 'if_required',
      // но если вдруг успех произошел мгновенно без 3DS.
      console.log('Payment succeeded immediately (no redirect). Redirecting to confirmation...');
      // Перенаправляем на страницу подтверждения для проверки статуса бэкендом
      router.push(`/orders/confirmation/${orderId}?status=processing`);
      // setIsLoading(false); // Не нужно, идет редирект
    } else {
      // Если нет ошибки и нет статуса 'succeeded', и не было редиректа -
      // это странная ситуация. Возможно, стоит показать общее сообщение.
      console.warn('Unexpected state after confirmPayment without redirect:', paymentIntent);
      setErrorMessage('Payment processing started. If you are not redirected, please check your order status.');
      setIsLoading(false); // Позволяем пользователю видеть сообщение
    }
  };

  const paymentElementOptions: StripePaymentElementOptions = {
    layout: 'tabs',
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <PaymentElement id="payment-element" options={paymentElementOptions} />

      <button disabled={isLoading || !stripe || !elements} id="submit" style={{ marginTop: '20px' }}>
        <span id="button-text">
          {isLoading ? 'Processing...' : 'Pay Now'}
        </span>
      </button>

      {errorMessage && <div id="payment-message" style={{ color: 'red', marginTop: '10px' }}>{errorMessage}</div>}
    </form>
  );
};

export default PaymentForm;
