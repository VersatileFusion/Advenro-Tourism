# Frontend Component Documentation

## Component Structure

```
src/client/scripts/
├── components/           # Reusable UI components
├── pages/               # Page components
├── layouts/             # Layout components
├── hooks/               # Custom React hooks
├── utils/              # Utility functions
└── context/            # React context providers
```

## Core Components

### Authentication Components

#### `LoginForm`
Component for user authentication.

**Props:**
- `onSubmit`: (email: string, password: string) => Promise<void>
- `loading`: boolean
- `error`: string | null

**Usage:**
```javascript
<LoginForm 
  onSubmit={handleLogin}
  loading={isLoading}
  error={loginError}
/>
```

#### `RegisterForm`
Component for user registration.

**Props:**
- `onSubmit`: (userData: UserData) => Promise<void>
- `loading`: boolean
- `error`: string | null

**Usage:**
```javascript
<RegisterForm 
  onSubmit={handleRegister}
  loading={isLoading}
  error={registerError}
/>
```

### Booking Components

#### `BookingCard`
Displays booking information in a card format.

**Props:**
- `booking`: BookingType
- `onCancel`: (bookingId: string) => void
- `onViewDetails`: (bookingId: string) => void

**Usage:**
```javascript
<BookingCard
  booking={bookingData}
  onCancel={handleCancelBooking}
  onViewDetails={handleViewDetails}
/>
```

#### `BookingForm`
Form for creating new bookings.

**Props:**
- `hotelId`: string
- `onSubmit`: (bookingData: BookingData) => Promise<void>
- `availableDates`: Date[]
- `pricing`: PricingType

**Usage:**
```javascript
<BookingForm
  hotelId="123"
  onSubmit={handleBooking}
  availableDates={dates}
  pricing={pricingData}
/>
```

### Hotel Components

#### `HotelCard`
Displays hotel information in a card format.

**Props:**
- `hotel`: HotelType
- `onBook`: (hotelId: string) => void
- `onViewDetails`: (hotelId: string) => void

**Usage:**
```javascript
<HotelCard
  hotel={hotelData}
  onBook={handleBooking}
  onViewDetails={handleViewDetails}
/>
```

#### `HotelSearch`
Search component for hotels.

**Props:**
- `onSearch`: (filters: FilterType) => void
- `initialFilters`: FilterType
- `loading`: boolean

**Usage:**
```javascript
<HotelSearch
  onSearch={handleSearch}
  initialFilters={defaultFilters}
  loading={isSearching}
/>
```

### Review Components

#### `ReviewList`
Displays a list of reviews.

**Props:**
- `reviews`: ReviewType[]
- `onLoadMore`: () => void
- `hasMore`: boolean
- `loading`: boolean

**Usage:**
```javascript
<ReviewList
  reviews={reviewData}
  onLoadMore={loadMoreReviews}
  hasMore={hasMoreReviews}
  loading={isLoading}
/>
```

#### `ReviewForm`
Form for submitting reviews.

**Props:**
- `onSubmit`: (reviewData: ReviewData) => Promise<void>
- `itemId`: string
- `itemType`: 'hotel' | 'tour'
- `loading`: boolean

**Usage:**
```javascript
<ReviewForm
  onSubmit={handleReviewSubmit}
  itemId="123"
  itemType="hotel"
  loading={isSubmitting}
/>
```

### UI Components

#### `Button`
Custom button component with different variants.

**Props:**
- `variant`: 'primary' | 'secondary' | 'outline'
- `size`: 'sm' | 'md' | 'lg'
- `loading`: boolean
- `disabled`: boolean
- `onClick`: () => void

**Usage:**
```javascript
<Button
  variant="primary"
  size="md"
  loading={isLoading}
  onClick={handleClick}
>
  Click Me
</Button>
```

#### `Modal`
Reusable modal component.

**Props:**
- `isOpen`: boolean
- `onClose`: () => void
- `title`: string
- `size`: 'sm' | 'md' | 'lg'

**Usage:**
```javascript
<Modal
  isOpen={showModal}
  onClose={handleClose}
  title="Confirmation"
  size="md"
>
  Modal content here
</Modal>
```

## Custom Hooks

### `useAuth`
Hook for authentication state and methods.

**Usage:**
```javascript
const { user, login, logout, isAuthenticated } = useAuth();
```

### `useBooking`
Hook for managing bookings.

**Usage:**
```javascript
const { bookings, createBooking, cancelBooking } = useBooking();
```

### `useNotifications`
Hook for handling notifications.

**Usage:**
```javascript
const { notifications, markAsRead, clearAll } = useNotifications();
```

## Context Providers

### `AuthProvider`
Provides authentication context to the application.

**Usage:**
```javascript
<AuthProvider>
  <App />
</AuthProvider>
```

### `NotificationProvider`
Provides notification context to the application.

**Usage:**
```javascript
<NotificationProvider>
  <App />
</NotificationProvider>
```

## Utility Functions

### `formatCurrency`
Formats numbers as currency.

**Usage:**
```javascript
const price = formatCurrency(1000); // "$1,000.00"
```

### `formatDate`
Formats dates in consistent way.

**Usage:**
```javascript
const date = formatDate(new Date()); // "Mar 12, 2024"
```

## Error Boundaries

### `ErrorBoundary`
Catches and handles JavaScript errors.

**Usage:**
```javascript
<ErrorBoundary fallback={<ErrorPage />}>
  <Component />
</ErrorBoundary>
```

## Styling

The application uses a combination of CSS modules and styled-components for styling. Each component has its own CSS module file with the same name.

### CSS Modules Example
```css
/* Button.module.css */
.button {
  /* styles */
}

.primary {
  /* primary variant styles */
}

.secondary {
  /* secondary variant styles */
}
```

### Styled Components Example
```javascript
const StyledCard = styled.div`
  /* card styles */
`;
```

## Best Practices

1. **Component Organization**
   - Keep components small and focused
   - Use proper file naming conventions
   - Group related components together

2. **Props**
   - Use TypeScript for prop types
   - Provide default props when appropriate
   - Document required vs optional props

3. **State Management**
   - Use hooks for local state
   - Context for global state
   - Redux for complex state

4. **Performance**
   - Implement proper memoization
   - Use lazy loading for routes
   - Optimize re-renders

5. **Accessibility**
   - Include proper ARIA labels
   - Ensure keyboard navigation
   - Maintain proper heading hierarchy 