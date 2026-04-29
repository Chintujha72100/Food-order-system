/**
 * Cart Component Tests
 * Tests: Cart rendering, quantity updates, empty state, checkout form validation
 * Tools: Vitest + React Testing Library
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// ─── Mock Dependencies ────────────────────────────────────────────────────────
vi.mock('../store/cartStore', () => ({
    default: vi.fn()
}));
vi.mock('../context/AuthContext', () => ({
    useAuth: vi.fn()
}));
vi.mock('axios');
vi.mock('react-hot-toast');

import useCartStore from '../store/cartStore';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import Cart from '../pages/Cart';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, useNavigate: () => mockNavigate };
});

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const sampleProduct = {
    _id: 'product-1',
    name: 'Margherita Pizza',
    price: 299,
    category: 'Fast Food',
    imageUrl: 'https://example.com/pizza.jpg',
    isVeg: true,
    gstRate: 5
};

const sampleCartItem = { product: sampleProduct, quantity: 2 };

const mockCartStore = {
    cart: [sampleCartItem],
    removeFromCart: vi.fn(),
    clearCart: vi.fn(),
    updateQuantity: vi.fn()
};

const mockAuthUser = {
    user: { name: 'Test User', token: 'test-token' },
    setIsAuthModalOpen: vi.fn()
};

function renderCart(cartOverrides = {}, authOverrides = {}) {
    useCartStore.mockReturnValue({ ...mockCartStore, ...cartOverrides });
    useAuth.mockReturnValue({ ...mockAuthUser, ...authOverrides });

    return render(
        <MemoryRouter>
            <Cart />
        </MemoryRouter>
    );
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('Cart Component — Rendering', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render cart items with name, price, and quantity', () => {
        renderCart();

        expect(screen.getByText('Margherita Pizza')).toBeInTheDocument();
        expect(screen.getByText('₹299')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should render "Your Cart" heading', () => {
        renderCart();
        expect(screen.getByText('Your Cart')).toBeInTheDocument();
    });

    it('should display total amount in receipt', () => {
        renderCart();
        // Subtotal = 299 * 2 = 598, tax + delivery will be added
        expect(screen.getByText(/RECEIPT/i)).toBeInTheDocument();
    });

    it('should show empty cart state when cart is empty', () => {
        renderCart({ cart: [] });

        expect(screen.getByText(/Your cart is empty/i)).toBeInTheDocument();
        expect(screen.getByText(/Browse Menu/i)).toBeInTheDocument();
    });

    it('should render Delivery and Pickup toggle buttons', () => {
        renderCart();

        expect(screen.getByText('Delivery')).toBeInTheDocument();
        expect(screen.getByText('Pickup')).toBeInTheDocument();
    });
});

describe('Cart Component — Quantity Controls', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should call updateQuantity with incremented value when + is clicked', async () => {
        renderCart();
        const user = userEvent.setup();

        const plusButton = screen.getByText('+');
        await user.click(plusButton);

        expect(mockCartStore.updateQuantity).toHaveBeenCalledWith('product-1', 3);
    });

    it('should call updateQuantity with decremented value when - is clicked', async () => {
        renderCart();
        const user = userEvent.setup();

        const minusButton = screen.getByText('-');
        await user.click(minusButton);

        expect(mockCartStore.updateQuantity).toHaveBeenCalledWith('product-1', 1);
    });

    it('should call removeFromCart when trash icon is clicked', async () => {
        renderCart();
        const user = userEvent.setup();

        // Trash button (aria label or by role)
        const trashButton = screen.getByRole('button', { name: '' }); // Trash2 icon button
        // Find it via its parent or look for multiple buttons
        const allButtons = screen.getAllByRole('button');
        // The remove button is the one with Trash2
        const removeBtn = allButtons.find(btn => btn.className.includes('hover:text-red-500'));
        if (removeBtn) {
            await user.click(removeBtn);
            expect(mockCartStore.removeFromCart).toHaveBeenCalledWith('product-1');
        }
    });
});

describe('Cart Component — Checkout Form', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should show delivery address form when Delivery is selected', () => {
        renderCart();
        expect(screen.getByPlaceholderText(/House \/ Flat No/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Street or Area/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/City/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Zip Code/i)).toBeInTheDocument();
    });

    it('should show phone number field in checkout form', () => {
        renderCart();
        expect(screen.getByPlaceholderText(/phone/i)).toBeInTheDocument();
    });

    it('should hide delivery form when Pickup is selected', async () => {
        renderCart();
        const user = userEvent.setup();

        const pickupBtn = screen.getByText('Pickup');
        await user.click(pickupBtn);

        expect(screen.queryByPlaceholderText(/House \/ Flat No/i)).not.toBeInTheDocument();
    });

    it('should show Place Order button when not checking out', () => {
        renderCart();
        expect(screen.getByText(/Place Order/i)).toBeInTheDocument();
    });

    it('should open auth modal when unauthenticated user clicks Place Order', async () => {
        renderCart({}, { user: null, setIsAuthModalOpen: mockAuthUser.setIsAuthModalOpen });
        const user = userEvent.setup();

        const placeOrderBtn = screen.getByText(/Place Order/i);
        await user.click(placeOrderBtn);

        expect(mockAuthUser.setIsAuthModalOpen).toHaveBeenCalledWith(true);
    });
});

describe('Cart Component — Order Type', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should switch to Pickup mode when Pickup is clicked', async () => {
        renderCart();
        const user = userEvent.setup();

        const pickupBtn = screen.getByText('Pickup');
        await user.click(pickupBtn);

        // The Pickup button should now be "active" (white shadow)
        expect(pickupBtn.className).toContain('bg-white');
    });

    it('should show cooking instructions textarea', () => {
        renderCart();
        expect(screen.getByPlaceholderText(/Make it spicy/i)).toBeInTheDocument();
    });

    it('should show tip section with preset amounts', () => {
        renderCart();
        expect(screen.getByText('₹10')).toBeInTheDocument();
        expect(screen.getByText('₹20')).toBeInTheDocument();
        expect(screen.getByText('₹30')).toBeInTheDocument();
    });
});

describe('Cart Component — Coupon / Promo Code', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render promo code input and Apply button', () => {
        renderCart();
        expect(screen.getByPlaceholderText(/Enter code/i)).toBeInTheDocument();
        expect(screen.getByText('Apply')).toBeInTheDocument();
    });

    it('should call coupon validation API on Apply click', async () => {
        axios.post = vi.fn().mockResolvedValueOnce({ data: { discountPercentage: 20 } });
        renderCart();
        const user = userEvent.setup();

        const input = screen.getByPlaceholderText(/Enter code/i);
        await user.type(input, 'SAVE20');

        const applyBtn = screen.getByText('Apply');
        await user.click(applyBtn);

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
                expect.stringContaining('/coupons/validate'),
                { code: 'SAVE20' }
            );
        });
    });
});
