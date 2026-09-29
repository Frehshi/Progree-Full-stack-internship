import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Leaf, Lock, Menu, Minus, Plus, ShoppingBag, Trash2, Truck, User, X } from 'lucide-react';
import { api, money, readSession, writeSession } from '../lib/api';
import { Button } from '../components/Button';
import { AuthPanel } from '../components/AuthPanel';

function StoreHeader({ session, cartCount, onCart, onAuth, onSignOut }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="store-header"><Link to="/shop" className="store-brand">Northstar</Link><button className="icon-button store-menu" onClick={() => setMenuOpen((value) => !value)} aria-label="Toggle store menu"><Menu /></button><nav className={menuOpen ? 'is-open' : ''}><a href="#collection">Shop</a><a href="#about-store">About</a><Link to="/">Portfolio</Link></nav><div className="store-actions">{session ? <button className="account-button" onClick={onSignOut}><User size={18} /> {session.user.name.split(' ')[0]} · Sign out</button> : <button className="account-button" onClick={onAuth}><User size={18} /> Sign in</button>}<button className="cart-button" onClick={onCart}><ShoppingBag size={18} /> Cart ({cartCount})</button></div></header>
  );
}

function CartDrawer({ items, onClose, onQuantity, onCheckout, busy }) {
  const total = items.reduce((sum, item) => sum + item.product.priceCents * item.quantity, 0);
  return (
    <aside className="cart-drawer" aria-label="Shopping cart">
      <div className="drawer-heading"><h2>Your cart ({items.reduce((sum, item) => sum + item.quantity, 0)})</h2><button className="icon-button" onClick={onClose} aria-label="Close cart"><X /></button></div>
      <div className="cart-items">{items.length === 0 ? <div className="empty-cart"><ShoppingBag /><h3>Your cart is empty</h3><p>Add something thoughtful from the collection.</p></div> : items.map(({ product, quantity }) => <article className="cart-item" key={product.id}><img src={product.image} alt="" /><div><h3>{product.name}</h3><strong>{money(product.priceCents)}</strong><span className={product.inventory <= 3 ? 'stock-low' : 'stock-ok'}>{product.inventory <= 3 ? `Low stock — ${product.inventory} left` : 'In stock'}</span><div className="quantity-control"><button aria-label={`Decrease ${product.name}`} onClick={() => onQuantity(product.id, quantity - 1)}><Minus size={15} /></button><span>{quantity}</span><button aria-label={`Increase ${product.name}`} disabled={quantity >= product.inventory} onClick={() => onQuantity(product.id, quantity + 1)}><Plus size={15} /></button></div></div><button className="icon-button remove-item" aria-label={`Remove ${product.name}`} onClick={() => onQuantity(product.id, 0)}><Trash2 size={18} /></button></article>)}</div>
      <div className="cart-summary"><div><span>Subtotal</span><strong>{money(total)}</strong></div><p>Shipping and taxes are calculated at checkout.</p><Button disabled={!items.length || busy} onClick={onCheckout}><Lock size={17} /> {busy ? 'Preparing checkout...' : 'Secure checkout'}</Button><small>Payments are processed in Stripe test mode or the included local sandbox.</small></div>
    </aside>
  );
}

export function ShopPage() {
  const [session, setSession] = useState(readSession);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();

  const loadProducts = useCallback(async () => { const body = await api('/products'); setProducts(body.products); }, []);
  const loadCart = useCallback(async () => { if (!session) { setCart([]); return; } const body = await api('/cart'); setCart(body.items); }, [session]);
  useEffect(() => { loadProducts().catch((error) => setMessage(error.message)); }, [loadProducts]);
  useEffect(() => { loadCart().catch((error) => setMessage(error.message)); }, [loadCart]);
  useEffect(() => {
    const checkout = searchParams.get('checkout');
    if (checkout === 'success') { setMessage('Payment complete. Your order is confirmed and inventory has been updated.'); loadProducts(); loadCart(); setSearchParams({}, { replace: true }); }
    if (checkout === 'cancelled') { setMessage('Checkout was cancelled. Your cart is still here.'); setSearchParams({}, { replace: true }); }
  }, [searchParams, setSearchParams, loadProducts, loadCart]);

  const count = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  function requireSession(action) {
    if (!session) { setAuthOpen(true); setMessage('Sign in to keep your cart and continue to checkout.'); return false; }
    return action();
  }
  async function updateQuantity(productId, quantity) {
    await requireSession(async () => {
      try { await api('/cart', { method: 'POST', body: JSON.stringify({ productId, quantity }) }); await loadCart(); setCartOpen(true); } catch (error) { setMessage(error.message); }
    });
  }
  async function addProduct(product) {
    const current = cart.find((item) => item.product.id === product.id)?.quantity || 0;
    await updateQuantity(product.id, current + 1);
  }
  async function checkout() {
    setBusy(true);
    try {
      const body = await api('/checkout/session', { method: 'POST', body: '{}' });
      window.location.assign(body.checkoutUrl);
    } catch (error) { setMessage(error.message); setBusy(false); }
  }
  function authenticated(nextSession) { setSession(nextSession); setAuthOpen(false); setMessage(`Welcome, ${nextSession.user.name}. Your cart will now stay in sync.`); }
  function signOut() { writeSession(null); setSession(null); setCart([]); setMessage('You are signed out.'); }

  return (
    <div className="shop-page">
      <StoreHeader session={session} cartCount={count} onCart={() => setCartOpen(true)} onAuth={() => setAuthOpen(true)} onSignOut={signOut} />
      {message ? <div className="shop-message" role="status"><span>{message}</span><button className="icon-button" onClick={() => setMessage('')} aria-label="Dismiss message"><X size={17} /></button></div> : null}
      <main>
        <section className="store-hero"><div><h1>Everyday essentials,<br />thoughtfully made.</h1><p>A small collection of durable objects for calmer daily routines.</p><a className="button button--primary" href="#collection">Shop collection</a></div><img src="/products/orbit-bottle.webp" alt="Sage green Orbit Bottle on a stone surface" /></section>
        <section className="collection" id="collection"><div className="section-heading"><h2>The collection</h2><span>{products.length} considered objects</span></div><div className="product-grid">{products.map((product) => <article className="product-card" key={product.id}><div className="product-image"><img src={product.image} alt={product.name} /></div><div className="product-meta"><div><h3>{product.name}</h3><p>{product.description}</p></div><strong>{money(product.priceCents)}</strong></div><span className={product.inventory <= 3 ? 'stock-low' : 'stock-ok'}>{product.inventory <= 3 ? `Low stock — ${product.inventory} left` : 'In stock'}</span><Button disabled={product.inventory === 0} onClick={() => addProduct(product)}>{product.inventory === 0 ? 'Sold out' : 'Add to cart'}</Button></article>)}</div></section>
        <section className="store-values" id="about-store"><article><Leaf /><div><h3>Considered materials</h3><p>Durable, everyday objects made to last.</p></div></article><article><Truck /><div><h3>Reliable delivery</h3><p>Carefully packed and prepared with care.</p></div></article><article><Lock /><div><h3>Secure checkout</h3><p>Hosted Stripe test checkout with verified webhooks.</p></div></article></section>
      </main>
      <footer className="store-footer"><strong>Northstar</strong><span>Internship commerce sandbox · No real payments are processed.</span><Link to="/">Back to portfolio</Link></footer>
      {cartOpen ? <><div className="drawer-scrim" onClick={() => setCartOpen(false)} /><CartDrawer items={cart} onClose={() => setCartOpen(false)} onQuantity={updateQuantity} onCheckout={checkout} busy={busy} /></> : null}
      {authOpen ? <AuthPanel onAuthenticated={authenticated} onClose={() => setAuthOpen(false)} /> : null}
      {searchParams.get('checkout') === 'success' ? <div className="checkout-success"><CheckCircle2 /><h2>Order confirmed</h2></div> : null}
    </div>
  );
}

