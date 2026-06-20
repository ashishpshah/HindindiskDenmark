import logoUrl from "@/assets/main_logo-removebg-preview.png";

export { logoUrl };

export const navLinks = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/menu", label: "Menu" },
  { to: "/locations", label: "Locations" },
  { to: "/reservation", label: "Reservation" },

  { to: "/gallery", label: "Gallery" },
  { to: "/contact", label: "Contact" },
] as const;

export const heroSlides = [
  {
    title: "Authentic Indian Taste In Denmark",
    subtitle: "Experience traditional Indian flavors crafted with passion",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=80",
  },
  {
    title: "Reserve Your Table",
    subtitle: "Enjoy a memorable dining experience in the heart of Denmark",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1920&q=80",
  },
  {
    title: "Order Online",
    subtitle: "Freshly prepared meals delivered straight to your door",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1920&q=80",
  },
];

export const branches = [
  {
    name: "Hind Indisk Aarhus",
    city: "Aarhus",
    address: "Frederiksgade 72, 8000 Aarhus C",
    phone: "+45 86 12 34 56",
    hours: "Mon–Sun · 12:00 – 22:00",
    rating: 4.8,
    reviews: 2400,
    image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Hind Indisk Copenhagen",
    city: "Copenhagen",
    address: "Vesterbrogade 41, 1620 København",
    phone: "+45 33 22 11 88",
    hours: "Mon–Sun · 11:30 – 23:00",
    rating: 4.9,
    reviews: 3100,
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
  },
];

export const stats = [
  { value: "20+", label: "Years Experience" },
  { value: "50K+", label: "Happy Customers" },
  { value: "100+", label: "Indian Dishes" },
  { value: "2", label: "Locations" },
];

export const featuredMenu = [
  { name: "Butter Chicken", price: "149 DKK", category: "Main Course", rating: 4.9, image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80" },
  { name: "Chicken Biryani", price: "139 DKK", category: "Rice", rating: 4.8, image: "https://images.unsplash.com/photo-1633945274309-2c16c9682a8d?auto=format&fit=crop&w=800&q=80" },
  { name: "Paneer Tikka", price: "119 DKK", category: "Starter", rating: 4.7, image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80" },
  { name: "Lamb Rogan Josh", price: "169 DKK", category: "Main Course", rating: 4.9, image: "https://images.unsplash.com/photo-1545247181-516773cae754?auto=format&fit=crop&w=800&q=80" },
  { name: "Garlic Naan", price: "39 DKK", category: "Bread", rating: 4.8, image: "https://images.unsplash.com/photo-1626776876729-bab4369a5a5a?auto=format&fit=crop&w=800&q=80" },
  { name: "Gulab Jamun", price: "59 DKK", category: "Dessert", rating: 4.9, image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80" },
];

export const whyChooseUs = [
  { title: "Authentic Recipes", desc: "Traditional recipes passed down for generations.", icon: "ChefHat" },
  { title: "Fresh Ingredients", desc: "Locally sourced, hand-picked daily.", icon: "Leaf" },
  { title: "Fast Delivery", desc: "Hot meals delivered across Denmark.", icon: "Bike" },
  { title: "Best Service", desc: "Warm hospitality and attentive care.", icon: "HeartHandshake" },
];

export const offers = [
  {
    title: "20% OFF Family Dinner",
    desc: "Gather the family and enjoy a grand feast. Applies to dine-in orders on weekends for tables of 4 or more.",
    code: "FAMILY20",
    badge: "20% OFF",
    validity: "Valid Sat - Sun",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
    ctaText: "Book Table",
    ctaLink: "/reservation"
  },
  {
    title: "Free Garlic Naan",
    desc: "Get our signature tandoor-baked Garlic Naan for free with any online food order above 250 DKK.",
    code: "NAANFREE",
    badge: "FREE NAAN",
    validity: "Online Only",
    image: "https://images.unsplash.com/photo-1626776876729-bab4369a5a5a?auto=format&fit=crop&w=800&q=80",
    ctaText: "Order Online",
    ctaLink: "/menu"
  },
  {
    title: "Lunch Special Combo",
    desc: "Indulge in a perfect mid-day break with a curated two-course lunch menu starting from just 89 DKK.",
    code: "LUNCH89",
    badge: "FROM 89 DKK",
    validity: "Mon - Fri, 11:30 - 15:00",
    image: "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80",
    ctaText: "View Menu",
    ctaLink: "/menu"
  },
];

export const reviews = [
  { name: "Emma Jensen", rating: 5, review: "Best Indian restaurant in Denmark. The butter chicken is unforgettable.", city: "Aarhus" },
  { name: "Michael Hansen", rating: 5, review: "Amazing food and service. We come back every month.", city: "Copenhagen" },
  { name: "Sara Lind", rating: 5, review: "Beautifully spiced dishes and a lovely warm atmosphere.", city: "Aarhus" },
  { name: "Lukas Møller", rating: 5, review: "Outstanding biryani. Hospitality on another level.", city: "Copenhagen" },
];

export const galleryImages = [
  "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1633945274309-2c16c9682a8d?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1545247181-516773cae754?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1626776876729-bab4369a5a5a?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1505253758473-96b7015fcd40?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1514326640560-7d063ef2aed5?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80",
];

export const faqs = [
  { q: "Do I need a reservation?", a: "Walk-ins are welcome but we recommend booking on weekends to secure a table." },
  { q: "Do you deliver?", a: "Yes, we deliver across Aarhus and Copenhagen via our online ordering system." },
  { q: "Are there vegetarian and vegan options?", a: "We offer an extensive selection of vegetarian, vegan, and gluten-free dishes." },
  { q: "How can I pay?", a: "We accept all major cards, MobilePay, and cash at both locations." },
  { q: "What are your opening hours?", a: "Aarhus: 12:00–22:00 daily. Copenhagen: 11:30–23:00 daily." },
];

export const menuCategories = ["Starters", "Main Course", "Rice", "Bread", "Desserts", "Drinks"] as const;

export const menuItems = [
  { name: "Samosa", category: "Starters", price: 49, desc: "Crispy pastry filled with spiced potatoes and peas.", veg: true, spicy: 1, image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80" },
  { name: "Paneer Tikka", category: "Starters", price: 119, desc: "Marinated cottage cheese, flame grilled.", veg: true, spicy: 2, image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80" },
  { name: "Chicken Pakora", category: "Starters", price: 99, desc: "Golden fried marinated chicken bites.", veg: false, spicy: 2, image: "https://images.unsplash.com/photo-1606491048802-8342506d6471?auto=format&fit=crop&w=800&q=80" },
  { name: "Butter Chicken", category: "Main Course", price: 149, desc: "Tandoori chicken in creamy tomato sauce.", veg: false, spicy: 1, image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80" },
  { name: "Lamb Rogan Josh", category: "Main Course", price: 169, desc: "Slow-cooked lamb in Kashmiri spices.", veg: false, spicy: 3, image: "https://images.unsplash.com/photo-1545247181-516773cae754?auto=format&fit=crop&w=800&q=80" },
  { name: "Palak Paneer", category: "Main Course", price: 139, desc: "Cottage cheese in silky spinach gravy.", veg: true, spicy: 1, image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80" },
  { name: "Chicken Biryani", category: "Rice", price: 139, desc: "Fragrant basmati rice with chicken and saffron.", veg: false, spicy: 2, image: "https://images.unsplash.com/photo-1633945274309-2c16c9682a8d?auto=format&fit=crop&w=800&q=80" },
  { name: "Vegetable Biryani", category: "Rice", price: 119, desc: "Aromatic rice with garden vegetables.", veg: true, spicy: 1, image: "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80" },
  { name: "Garlic Naan", category: "Bread", price: 39, desc: "Soft tandoor bread brushed with garlic butter.", veg: true, spicy: 0, image: "https://images.unsplash.com/photo-1626776876729-bab4369a5a5a?auto=format&fit=crop&w=800&q=80" },
  { name: "Butter Naan", category: "Bread", price: 35, desc: "Classic tandoor naan with melted butter.", veg: true, spicy: 0, image: "https://images.unsplash.com/photo-1633237308525-cd587cf71926?auto=format&fit=crop&w=800&q=80" },
  { name: "Gulab Jamun", category: "Desserts", price: 59, desc: "Warm milk dumplings in rose syrup.", veg: true, spicy: 0, image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80" },
  { name: "Mango Lassi", category: "Drinks", price: 49, desc: "Creamy yoghurt drink with Alphonso mango.", veg: true, spicy: 0, image: "https://images.unsplash.com/photo-1626200419199-391ae4be7a41?auto=format&fit=crop&w=800&q=80" },
  { name: "Masala Chai", category: "Drinks", price: 35, desc: "Spiced black tea with milk.", veg: true, spicy: 0, image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80" },
];

export const teamMembers = [
  { name: "Chef Arjun Patel", role: "Head Chef", image: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=600&q=80" },
  { name: "Priya Sharma", role: "Sous Chef", image: "https://images.unsplash.com/photo-1607631568010-a87245c0daf8?auto=format&fit=crop&w=600&q=80" },
  { name: "Anders Berg", role: "Restaurant Manager", image: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=600&q=80" },
];

export const timeline = [
  { year: "2004", title: "The Beginning", desc: "Our family opens the first kitchen in Aarhus." },
  { year: "2010", title: "Growing Roots", desc: "Loyal community of guests across Jutland." },
  { year: "2017", title: "Copenhagen Opens", desc: "Second flagship location debuts in Vesterbro." },
  { year: "2024", title: "Award Winning", desc: "Recognized as Denmark's top Indian restaurant." },
];
