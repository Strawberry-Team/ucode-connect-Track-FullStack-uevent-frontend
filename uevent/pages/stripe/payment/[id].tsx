// src/pages/orders/[orderId]/payment.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import PaymentForm from '../../../components/PaymentForm'; // Путь к вашему компоненту
import axios from 'axios';
import Link from 'next/link';
import { paymentService} from '../../../services/paymentService';
// Глобальная переменная для Stripe Promise, чтобы не перезагружать при каждом рендере
let stripePromise: ReturnType<typeof loadStripe> | null = null;

const PaymentPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query; // Получаем orderId из URL

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<string | null>(null); // Статус заказа с бэка

  useEffect(() => {
    const initializePayment = async () => {
      // Убедимся, что orderId доступен и является строкой
      if (!id || typeof id !== 'string') {
        // Можно подождать или показать ошибку, если ID не пришел
        if (router.isReady) { // Ждем пока router будет готов
             setError('Order ID is missing or invalid.');
             setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);
      setClientSecret(null); // Сбрасываем перед новым запросом

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        console.log(`Requesting payment init data for order ${id}`);
        // Шаг 5: Запрос на инициализацию платежа
        
        const response = await paymentService.createPaymentIntent(id);

        const { clientSecret: cs, publishableKey: pk, orderStatus: status } = response.data;
        console.log(`Received payment init data: Status - ${status}`);
        setOrderStatus(status);

        // Проверяем статус заказа ПЕРЕД настройкой формы
        if (status !== 'PENDING') {
          setError(`This order cannot be paid. Current status: ${status}. Please create a new order.`);
          setLoading(false);
          return; // Не продолжаем инициализацию
        }

        // Инициализируем Stripe Promise только один раз с полученным ключом
        if (!stripePromise && pk) {
          console.log('Initializing Stripe with publishable key...');
          stripePromise = loadStripe(pk);
        }

        if (!cs) {
             throw new Error('Client Secret not received from backend.');
        }

        setClientSecret(cs); // Сохраняем clientSecret для Elements

      } catch (err: any) {
        console.error('Error initializing payment:', err);
        setError(err.response?.data?.message || 'Failed to load payment details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    // Вызываем инициализацию только когда router готов и orderId доступен
    if (router.isReady) {
        initializePayment();
    }

  }, [id, router.isReady]); // Зависим от orderId и готовности роутера

  // Опции для Stripe Elements (включая clientSecret)
  const options: StripeElementsOptions = {
    clientSecret: clientSecret ?? undefined, // Передаем clientSecret, если он есть
    appearance: {
      theme: 'stripe', // Настройте внешний вид
      // ... другие параметры appearance
    },
  };

  // --- Рендеринг ---
  if (loading) {
    return <div>Loading payment details...</div>;
  }

  if (error) {
    return (
        <div>
            <h1>Payment Error</h1>
            <p style={{ color: 'red' }}>{error}</p>
            {/* <Link href="/checkout">Return to Checkout</Link> Или на другую страницу */}
        </div>
    );
  }

  // Рендерим форму только если есть clientSecret и stripePromise
  if (!clientSecret || !stripePromise) {
    return <div>Error: Could not initialize payment form. Please refresh the page.</div>;
  }


  return (
    <div>
      <h1>Complete Payment for Order #{id}</h1>
      <p>Order Status: {orderStatus}</p> {/* Показываем статус */}
      <Elements options={options} stripe={stripePromise}>
        <PaymentForm orderId={Number(id)} clientSecret={clientSecret} />
      </Elements>
    </div>
  );
};

export default PaymentPage;
