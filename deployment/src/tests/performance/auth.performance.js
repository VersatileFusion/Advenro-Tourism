import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '1m', target: 50 },  // Ramp up to 50 users
    { duration: '3m', target: 50 },  // Stay at 50 users for 3 minutes
    { duration: '1m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    errors: ['rate<0.1'],             // Error rate should be below 10%
  },
};

const BASE_URL = 'http://localhost:3000/api';

export default function () {
  // Test user registration performance
  const registerPayload = {
    firstName: `TestUser${Math.random()}`,
    lastName: 'Performance',
    email: `test.${Math.random()}@example.com`,
    password: 'Password123!'
  };

  const registerRes = http.post(`${BASE_URL}/auth/register`, JSON.stringify(registerPayload), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(registerRes, {
    'registration successful': (r) => r.status === 201,
  }) || errorRate.add(1);

  sleep(1);

  // Test login performance
  const loginPayload = {
    email: registerPayload.email,
    password: registerPayload.password,
  };

  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify(loginPayload), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginRes, {
    'login successful': (r) => r.status === 200,
    'has token': (r) => JSON.parse(r.body).token !== undefined,
  }) || errorRate.add(1);

  sleep(1);

  // Test protected endpoint performance
  const token = JSON.parse(loginRes.body).token;
  const profileRes = http.get(`${BASE_URL}/auth/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  check(profileRes, {
    'profile access successful': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);
} 