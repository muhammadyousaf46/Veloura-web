// ==========================================================================
// VELOURA — Central Data Engine & Hybrid Supabase / LocalStore
// Manages menu items, categories, orders, reservations, reviews, and roles.
// Ensures 100% functionality both with Supabase and with instant local fallback.
// ==========================================================================

(function () {
  if (window.__velouraDataEngineLoaded) return;
  window.__velouraDataEngineLoaded = true;

  // Curated High-Definition Unsplash Food & Dining Imagery
  const IMAGES = {
    // Starters
    truffleArancini: "https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=800&q=80",
    bruschetta: "https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?auto=format&fit=crop&w=800&q=80",
    searedScallops: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=80",
    mushroomTart: "https://images.unsplash.com/photo-1608897013039-887f21d8c804?auto=format&fit=crop&w=800&q=80",

    // Main Course
    wagyuRibeye: "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=800&q=80",
    panSearedSalmon: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80",
    lambRack: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    lobsterRisotto: "https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?auto=format&fit=crop&w=800&q=80",
    royalChickenHandi: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80",

    // Fast Food
    velouraBurger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
    trufflePizza: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
    crispySliders: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80",
    parmesanFries: "https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80",

    // Desserts
    chocFondant: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80",
    pannaCotta: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80",
    goldCheesecake: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80",
    classicTiramisu: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80",

    // Beverages
    smokedMocktail: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80",
    saffronElixir: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80",
    espressoMartini: "https://images.unsplash.com/photo-1545438102-799c3991ffb2?auto=format&fit=crop&w=800&q=80",
    bloodOrangeFizz: "https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&w=800&q=80",

    // Banners & Gallery
    heroBanner: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=85",
    ambianceDining: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1200&q=80",
    chefPrep: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=1200&q=80",
    wineCellar: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1200&q=80"
  };

  // 5 Canonical Categories requested by User
  const DEFAULT_CATEGORIES = [
    { id: "cat-starters", name: "Starters", description: "Artisanal appetisers designed to awaken the palate", icon: "sparkles" },
    { id: "cat-main", name: "Main Course", description: "Masterfully grilled prime cuts, fresh seafood, and rich gravies", icon: "utensils" },
    { id: "cat-fastfood", name: "Fast Food", description: "Gourmet burgers, truffle fries, and stone-baked pizzas", icon: "flame" },
    { id: "cat-desserts", name: "Desserts", description: "Decadent confections, French patisserie, and chocolate artistry", icon: "cake" },
    { id: "cat-beverages", name: "Beverages", description: "Botanical mocktails, craft sodas, and artisanal roasts", icon: "wine" }
  ];

  // Verified, rich Menu Items
  const DEFAULT_MENU_ITEMS = [
    // --- Starters ---
    {
      id: "dish-101",
      category_id: "cat-starters",
      category_name: "Starters",
      name: "Truffle Arancini with Saffron Aioli",
      description: "Crisp Arborio risotto spheres infused with black winter truffle and molten fontina cheese.",
      price: 1450,
      image_url: IMAGES.truffleArancini,
      is_available: true,
      is_popular: true,
      is_vegetarian: true,
      rating: 4.9,
      reviews_count: 142
    },
    {
      id: "dish-102",
      category_id: "cat-starters",
      category_name: "Starters",
      name: "Wild Mushroom & Chèvre Tart",
      description: "Caramelized shallots, wild forest chanterelles, and whipped French goat cheese on flaky puff pastry.",
      price: 1650,
      image_url: IMAGES.mushroomTart,
      is_available: true,
      is_popular: false,
      is_vegetarian: true,
      rating: 4.8,
      reviews_count: 89
    },
    {
      id: "dish-103",
      category_id: "cat-starters",
      category_name: "Starters",
      name: "Seared Hokkaido Scallops",
      description: "Pan-caramelized sea scallops served over minted pea purée and crisp pancetta crumb.",
      price: 2400,
      image_url: IMAGES.searedScallops,
      is_available: true,
      is_popular: true,
      is_vegetarian: false,
      rating: 5.0,
      reviews_count: 215
    },
    {
      id: "dish-104",
      category_id: "cat-starters",
      category_name: "Starters",
      name: "Heirloom Tomato & Burrata Bruschetta",
      description: "Aged balsamic reduction, fresh basil pesto, and creamy Puglia burrata on toasted sourdough.",
      price: 1350,
      image_url: IMAGES.bruschetta,
      is_available: true,
      is_popular: false,
      is_vegetarian: true,
      rating: 4.7,
      reviews_count: 94
    },

    // --- Main Course ---
    {
      id: "dish-201",
      category_id: "cat-main",
      category_name: "Main Course",
      name: "Prime Wagyu Ribeye Steak (A5)",
      description: "Charcoal-seared Australian Wagyu marble score 8+, bone marrow jus, and smoked garlic purée.",
      price: 6850,
      image_url: IMAGES.wagyuRibeye,
      is_available: true,
      is_popular: true,
      is_vegetarian: false,
      rating: 5.0,
      reviews_count: 384
    },
    {
      id: "dish-202",
      category_id: "cat-main",
      category_name: "Main Course",
      name: "Herb-Crusted New Zealand Lamb Rack",
      description: "Pistachio and Dijon crust, fondant potato, glazed baby heirloom carrots, and rosemary demi-glace.",
      price: 4950,
      image_url: IMAGES.lambRack,
      is_available: true,
      is_popular: true,
      is_vegetarian: false,
      rating: 4.9,
      reviews_count: 178
    },
    {
      id: "dish-203",
      category_id: "cat-main",
      category_name: "Main Course",
      name: "Norwegian Salmon with Beurre Blanc",
      description: "Crispy skin Atlantic salmon over asparagus spears, saffron fingerling potatoes, and lemon caper emulsion.",
      price: 3850,
      image_url: IMAGES.panSearedSalmon,
      is_available: true,
      is_popular: false,
      is_vegetarian: false,
      rating: 4.8,
      reviews_count: 132
    },
    {
      id: "dish-204",
      category_id: "cat-main",
      category_name: "Main Course",
      name: "Saffron Lobster Risotto",
      description: "Poached butter lobster tail, Carnaroli rice, Persian saffron, and 24-month Parmigiano-Reggiano.",
      price: 4200,
      image_url: IMAGES.lobsterRisotto,
      is_available: true,
      is_popular: true,
      is_vegetarian: false,
      rating: 4.9,
      reviews_count: 164
    },
    {
      id: "dish-205",
      category_id: "cat-main",
      category_name: "Main Course",
      name: "Royal Veloura Dum Pukht Handi",
      description: "Slow-simmered organic chicken in rich cashew-saffron gravy, sealed in clay pot with artisanal spices.",
      price: 2850,
      image_url: IMAGES.royalChickenHandi,
      is_available: true,
      is_popular: false,
      is_vegetarian: false,
      rating: 4.9,
      reviews_count: 220
    },

    // --- Fast Food ---
    {
      id: "dish-301",
      category_id: "cat-fastfood",
      category_name: "Fast Food",
      name: "Veloura Grand Wagyu Burger",
      description: "Hand-pressed Wagyu chuck patty, melted aged cheddar, caramelized onion jam, and truffle aioli on toasted brioche.",
      price: 2150,
      image_url: IMAGES.velouraBurger,
      is_available: true,
      is_popular: true,
      is_vegetarian: false,
      rating: 4.9,
      reviews_count: 412
    },
    {
      id: "dish-302",
      category_id: "cat-fastfood",
      category_name: "Fast Food",
      name: "Black Truffle & Wild Funghi Pizza",
      description: "Woodfired Neapolitan dough, fior di latte mozzarella, sautéed forest mushrooms, and shaved Italian truffles.",
      price: 2650,
      image_url: IMAGES.trufflePizza,
      is_available: true,
      is_popular: true,
      is_vegetarian: true,
      rating: 4.8,
      reviews_count: 280
    },
    {
      id: "dish-303",
      category_id: "cat-fastfood",
      category_name: "Fast Food",
      name: "Crispy Buttermilk Chicken Sliders",
      description: "Spiced honey glazed crispy chicken, pickled jalapeño slaw, and smoked paprika cream on potato rolls.",
      price: 1750,
      image_url: IMAGES.crispySliders,
      is_available: true,
      is_popular: false,
      is_vegetarian: false,
      rating: 4.7,
      reviews_count: 195
    },
    {
      id: "dish-304",
      category_id: "cat-fastfood",
      category_name: "Fast Food",
      name: "Hand-Cut Truffle & Parmesan Fries",
      description: "Triple-cooked russet fries tossed in white truffle oil, rosemary sea salt, and aged microplane parmesan.",
      price: 950,
      image_url: IMAGES.parmesanFries,
      is_available: true,
      is_popular: true,
      is_vegetarian: true,
      rating: 4.9,
      reviews_count: 360
    },

    // --- Desserts ---
    {
      id: "dish-401",
      category_id: "cat-desserts",
      category_name: "Desserts",
      name: "Valrhona Dark Chocolate Fondant",
      description: "Warm molten center of 70% French dark chocolate paired with Tahitian vanilla bean gelato.",
      price: 1550,
      image_url: IMAGES.chocFondant,
      is_available: true,
      is_popular: true,
      is_vegetarian: true,
      rating: 5.0,
      reviews_count: 320
    },
    {
      id: "dish-402",
      category_id: "cat-desserts",
      category_name: "Desserts",
      name: "24K Gold Leaf Basque Cheesecake",
      description: "Creamy burnt Basque cheesecake adorned with edible 24K gold foil and wild blackberry compote.",
      price: 1950,
      image_url: IMAGES.goldCheesecake,
      is_available: true,
      is_popular: true,
      is_vegetarian: true,
      rating: 4.9,
      reviews_count: 180
    },
    {
      id: "dish-403",
      category_id: "cat-desserts",
      category_name: "Desserts",
      name: "Vanilla Bean Panna Cotta",
      description: "Silky Madagascar vanilla cream paired with ruby strawberry gelée and candied basil crisps.",
      price: 1250,
      image_url: IMAGES.pannaCotta,
      is_available: true,
      is_popular: false,
      is_vegetarian: true,
      rating: 4.7,
      reviews_count: 98
    },
    {
      id: "dish-404",
      category_id: "cat-desserts",
      category_name: "Desserts",
      name: "Artisanal Venetian Tiramisu",
      description: "Espresso-soaked Savoiardi biscuits, whipped mascarpone zabaione, and single-origin cocoa dusting.",
      price: 1450,
      image_url: IMAGES.classicTiramisu,
      is_available: true,
      is_popular: false,
      is_vegetarian: true,
      rating: 4.8,
      reviews_count: 144
    },

    // --- Beverages ---
    {
      id: "dish-501",
      category_id: "cat-beverages",
      category_name: "Beverages",
      name: "Smoked Rosemary & Blackberry Mocktail",
      description: "Handcrafted with wild muddled blackberries, fresh rosemary smoke, agave nectar, and sparkling soda.",
      price: 950,
      image_url: IMAGES.smokedMocktail,
      is_available: true,
      is_popular: true,
      is_vegetarian: true,
      rating: 4.9,
      reviews_count: 210
    },
    {
      id: "dish-502",
      category_id: "cat-beverages",
      category_name: "Beverages",
      name: "Royal Persian Saffron & Rose Elixir",
      description: "Infused with pure Iranian saffron strands, Damascus rose water, crushed pistachios, and chia seeds.",
      price: 1100,
      image_url: IMAGES.saffronElixir,
      is_available: true,
      is_popular: true,
      is_vegetarian: true,
      rating: 4.9,
      reviews_count: 165
    },
    {
      id: "dish-503",
      category_id: "cat-beverages",
      category_name: "Beverages",
      name: "Cold Brew Espresso Velvet",
      description: "Slow-extracted Ethiopian Yirgacheffe coffee, Madagascar vanilla bean syrup, and frothed oat cream.",
      price: 850,
      image_url: IMAGES.espressoMartini,
      is_available: true,
      is_popular: false,
      is_vegetarian: true,
      rating: 4.8,
      reviews_count: 128
    },
    {
      id: "dish-504",
      category_id: "cat-beverages",
      category_name: "Beverages",
      name: "Sparkling Blood Orange & Thyme Fizz",
      description: "Cold-pressed Sicilian blood oranges, fresh thyme sprig, and San Pellegrino mineral water.",
      price: 750,
      image_url: IMAGES.bloodOrangeFizz,
      is_available: true,
      is_popular: false,
      is_vegetarian: true,
      rating: 4.7,
      reviews_count: 115
    }
  ];

  // Chef's Daily Specials (Featured on Landing Page Carousel)
  const CHEF_SPECIALS = [
    {
      id: "special-1",
      name: "Charcoal Seared Wagyu A5 Ribeye",
      tagline: "The Crown Jewel of Veloura",
      description: "Signature cut grilled over imported binchotan charcoal. Finished with edible gold leaf, smoked shallot confit, and 30-year balsamic glaze.",
      price: 6850,
      pairing: "Smoked Rosemary & Blackberry Mocktail",
      image: IMAGES.wagyuRibeye,
      dishId: "dish-201"
    },
    {
      id: "special-2",
      name: "Carnaroli Saffron & Poached Lobster Risotto",
      tagline: "Mediterranean Coastal Luxury",
      description: "Delicate lobster tail gently poached in seaweed butter, folded into rich saffron-perfumed Arborio rice with crispy parmesan crisps.",
      price: 4200,
      pairing: "Sparkling Blood Orange Fizz",
      image: IMAGES.lobsterRisotto,
      dishId: "dish-204"
    },
    {
      id: "special-3",
      name: "24K Gold Leaf Basque Cheesecake",
      tagline: "Opulent Sweet Masterpiece",
      description: "Caramelized exterior with a luscious molten cream cheese center, hand-leafed with 24K edible gold and wild mountain blackberry compote.",
      price: 1950,
      pairing: "Cold Brew Espresso Velvet",
      image: IMAGES.goldCheesecake,
      dishId: "dish-402"
    }
  ];

  // Gallery Photos (12 High-Res Unsplash Images for gallery.html)
  const GALLERY_COLLECTION = [
    { name: "Signature A5 Wagyu Plating", category: "Food", image: IMAGES.wagyuRibeye, caption: "Charcoal-seared Wagyu with smoked garlic cream" },
    { name: "Royal Dining Hall & Chandeliers", category: "Interior", image: IMAGES.ambianceDining, caption: "Grand dining hall ambiance in Gujrat" },
    { name: "Head Chef Finishing Course", category: "Chef", image: IMAGES.chefPrep, caption: "Master Chef adding culinary finishings" },
    { name: "Poached Maine Lobster", category: "Food", image: IMAGES.lobsterRisotto, caption: "Saffron risotto with whole lobster tail" },
    { name: "VIP Private Tasting Lounge", category: "Dining", image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80", caption: "Exclusive seating for intimate dinner events" },
    { name: "Artisanal Curated Cellar", category: "Interior", image: IMAGES.wineCellar, caption: "Temperature controlled reserve collection" },
    { name: "Valrhona Chocolate Artistry", category: "Food", image: IMAGES.chocFondant, caption: "Warm chocolate lava with gold leaf" },
    { name: "Executive Chef at the Grill", category: "Chef", image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80", caption: "Binchotan charcoal searing station" },
    { name: "Candlelit Evening Seating", category: "Dining", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80", caption: "Romantic evening ambiance" },
    { name: "Botanical Smoke Crafting", category: "Beverages", image: IMAGES.smokedMocktail, caption: "Infusing wood smoke into signature drinks" },
    { name: "Dessert Course Symphony", category: "Food", image: IMAGES.pannaCotta, caption: "Tahitian vanilla panna cotta with berry gelée" },
    { name: "Veloura Grand Entrance", category: "Interior", image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80", caption: "Welcoming foyer at Ramtali, Gujrat" }
  ];

  // Customer Reviews & Feedback
  const CUSTOMER_REVIEWS = [
    {
      name: "Malik Zaryab Khan",
      role: "Verified Epicurean Diner",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      rating: 5,
      date: "October 2026",
      dish: "Prime Wagyu Ribeye Steak",
      comment: "Veloura has completely revolutionized fine dining in Gujrat. The Wagyu Ribeye cuts like velvet and the candlelit ambiance is world-class. Worth every rupee."
    },
    {
      name: "Dr. Ayesha Tariq",
      role: "Regular Gastronomy Patron",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      rating: 5,
      date: "September 2026",
      dish: "Saffron Lobster Risotto",
      comment: "Celebrated our wedding anniversary at Veloura. The hospitality, table reservation setup, and the Persian Saffron Mocktail were transcendent. An unforgettable evening."
    },
    {
      name: "Hamza Shafique",
      role: "Food Connoisseur & Critic",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
      rating: 5,
      date: "August 2026",
      dish: "Valrhona Chocolate Fondant",
      comment: "The attention to detail from plating to service is Michelin-level. Ordering online was seamless and the food arrived piping hot in luxury packaging."
    }
  ];

  // Active Promo Codes
  const PROMO_CODES = {
    VELOURA10: { code: "VELOURA10", discountPercent: 10, description: "10% off your entire dining order" },
    CHEF20: { code: "CHEF20", discountPercent: 20, description: "20% VIP Chef's Table Special" },
    WELCOME: { code: "WELCOME", discountPercent: 15, description: "15% off first order discount" }
  };

  // Supported Roles
  const ROLES = {
    ADMIN: "admin",
    USER: "registered",
    GUEST: "guest"
  };

  // Default Mock User Profile (for registered role demo)
  const DEFAULT_USER_PROFILE = {
    id: "user-registered-001",
    name: "Muhammad Yousaf",
    email: "shahyousaf2004@gmail.com",
    phone: "+92 300 0000000",
    role: ROLES.USER,
    loyaltyPoints: 520,
    tier: "Gold Epicurean",
    addresses: [
      { id: "addr-1", label: "Home", address: "House 14, Street 3, Model Town, Gujrat", isDefault: true },
      { id: "addr-2", label: "Office", address: "Chamber of Commerce Plaza, GT Road, Gujrat", isDefault: false }
    ],
    orderHistory: [
      {
        orderId: "VEL-94218",
        date: "2026-09-28",
        items: "Prime Wagyu Ribeye x1, Smoked Mocktail x2",
        total: 8750,
        status: "Delivered",
        payment: "Paid via JazzCash"
      },
      {
        orderId: "VEL-89104",
        date: "2026-09-14",
        items: "Veloura Grand Burger x2, Truffle Fries x1",
        total: 5250,
        status: "Delivered",
        payment: "Cash on Delivery"
      }
    ]
  };

  // --------------------------------------------------------------------------
  // Local Storage Storage Helpers
  // --------------------------------------------------------------------------
  function loadLocal(key, defaultVal) {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultVal;
    } catch (e) {
      console.warn("Storage load error:", e);
      return defaultVal;
    }
  }

  function saveLocal(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.warn("Storage save error:", e);
    }
  }

  // Initialize or fetch items from local storage
  function getMenuItems() {
    let items = loadLocal("veloura_menu_items", null);
    if (!items || !items.length) {
      saveLocal("veloura_menu_items", DEFAULT_MENU_ITEMS);
      return DEFAULT_MENU_ITEMS;
    }
    return items;
  }

  function getCategories() {
    let cats = loadLocal("veloura_categories", null);
    if (!cats || !cats.length) {
      saveLocal("veloura_categories", DEFAULT_CATEGORIES);
      return DEFAULT_CATEGORIES;
    }
    return cats;
  }

  function getCurrentRole() {
    return loadLocal("veloura_current_role", ROLES.USER);
  }

  function setCurrentRole(role) {
    saveLocal("veloura_current_role", role);
    window.dispatchEvent(new CustomEvent("veloura-role-changed", { detail: { role } }));
  }

  function getUserProfile() {
    return loadLocal("veloura_user_profile", DEFAULT_USER_PROFILE);
  }

  function saveUserProfile(profile) {
    saveLocal("veloura_user_profile", profile);
  }

  function getOrders() {
    return loadLocal("veloura_orders", [
      {
        id: "VEL-94218",
        customer_name: "Muhammad Yousaf",
        phone: "+92 300 0000000",
        address: "House 14, Street 3, Model Town, Gujrat",
        city: "Gujrat",
        order_type: "delivery",
        payment_method: "jazzcash",
        order_status: "delivered",
        subtotal: 8250,
        tax: 412,
        delivery_fee: 250,
        discount: 0,
        total: 8912,
        created_at: "2026-09-28T19:42:00Z",
        items: [
          { name: "Prime Wagyu Ribeye Steak (A5)", quantity: 1, price: 6850 },
          { name: "Smoked Rosemary & Blackberry Mocktail", quantity: 2, price: 950 }
        ]
      },
      {
        id: "VEL-95012",
        customer_name: "Fatima Noor",
        phone: "+92 321 8899112",
        address: "Ramtali Main Boulevard, Gujrat",
        city: "Gujrat",
        order_type: "delivery",
        payment_method: "cod",
        order_status: "preparing",
        subtotal: 4800,
        tax: 240,
        delivery_fee: 250,
        discount: 480,
        total: 4810,
        created_at: new Date().toISOString(),
        items: [
          { name: "Veloura Grand Wagyu Burger", quantity: 2, price: 2150 },
          { name: "Hand-Cut Truffle & Parmesan Fries", quantity: 1, price: 950 }
        ]
      }
    ]);
  }

  function saveOrders(orders) {
    saveLocal("veloura_orders", orders);
  }

  function getReservations() {
    return loadLocal("veloura_reservations", [
      {
        id: "RES-104",
        name: "Muhammad Yousaf",
        phone: "+92 300 0000000",
        email: "shahyousaf2004@gmail.com",
        reservation_date: "2026-10-05",
        reservation_time: "20:00",
        guests: 4,
        special_request: "Quiet balcony table overlooking the fountain, celebrating birthday",
        status: "approved",
        created_at: "2026-10-02T15:20:00Z"
      },
      {
        id: "RES-105",
        name: "Tariq Mehmood",
        phone: "+92 333 4455667",
        email: "tariq@gmail.com",
        reservation_date: "2026-10-06",
        reservation_time: "19:30",
        guests: 2,
        special_request: "Chef's Table tasting experience",
        status: "pending",
        created_at: "2026-10-03T09:10:00Z"
      }
    ]);
  }

  function saveReservations(resList) {
    saveLocal("veloura_reservations", resList);
  }

  // --------------------------------------------------------------------------
  // Public Interface on window.VelouraData
  // --------------------------------------------------------------------------
  window.VelouraData = {
    IMAGES,
    DEFAULT_CATEGORIES,
    DEFAULT_MENU_ITEMS,
    CHEF_SPECIALS,
    GALLERY_COLLECTION,
    CUSTOMER_REVIEWS,
    PROMO_CODES,
    ROLES,

    getMenuItems,
    getCategories,
    getCurrentRole,
    setCurrentRole,
    getUserProfile,
    saveUserProfile,
    getOrders,
    saveOrders,
    getReservations,
    saveReservations,

    // Toggle stock availability
    toggleItemStock(itemId, isAvailable) {
      let items = getMenuItems();
      const idx = items.findIndex((i) => i.id === itemId);
      if (idx !== -1) {
        items[idx].is_available = isAvailable;
        saveLocal("veloura_menu_items", items);
      }

      // If connected to Supabase, update remote too
      if (window.supabase) {
        window.supabase
          .from("menu_items")
          .update({ is_available: isAvailable })
          .eq("id", itemId)
          .then(({ error }) => {
            if (error) console.warn("Supabase stock update error:", error.message);
          });
      }

      window.dispatchEvent(new CustomEvent("veloura-menu-updated", { detail: { itemId, isAvailable } }));
      return items;
    },

    // Add or update menu item
    upsertMenuItem(item) {
      let items = getMenuItems();
      const existingIdx = items.findIndex((i) => i.id === item.id);
      if (existingIdx !== -1) {
        items[existingIdx] = { ...items[existingIdx], ...item };
      } else {
        item.id = item.id || `dish-${Date.now()}`;
        items.unshift(item);
      }
      saveLocal("veloura_menu_items", items);

      if (window.supabase) {
        window.supabase
          .from("menu_items")
          .upsert(item)
          .then(({ error }) => {
            if (error) console.warn("Supabase upsert error:", error.message);
          });
      }

      window.dispatchEvent(new CustomEvent("veloura-menu-updated"));
      return items;
    },

    // Delete menu item
    deleteMenuItem(itemId) {
      let items = getMenuItems().filter((i) => i.id !== itemId);
      saveLocal("veloura_menu_items", items);

      if (window.supabase) {
        window.supabase
          .from("menu_items")
          .delete()
          .eq("id", itemId)
          .then(({ error }) => {
            if (error) console.warn("Supabase delete error:", error.message);
          });
      }

      window.dispatchEvent(new CustomEvent("veloura-menu-updated"));
      return items;
    },

    // Create a new order
    createOrder(orderData) {
      const orderId = `VEL-${Math.floor(10000 + Math.random() * 90000)}`;
      const newOrder = {
        id: orderId,
        created_at: new Date().toISOString(),
        order_status: "pending",
        ...orderData
      };

      const orders = getOrders();
      orders.unshift(newOrder);
      saveOrders(orders);

      // Award Loyalty Reward Points (10 points per Rs 100 spent)
      const profile = getUserProfile();
      const pointsEarned = Math.floor((orderData.total || 0) / 100) * 10;
      profile.loyaltyPoints = (profile.loyaltyPoints || 0) + pointsEarned;
      profile.orderHistory.unshift({
        orderId: newOrder.id,
        date: new Date().toISOString().split("T")[0],
        items: (newOrder.items || []).map((i) => `${i.name} x${i.quantity}`).join(", "),
        total: newOrder.total,
        status: "Pending",
        payment: newOrder.payment_method === "cod" ? "Cash on Delivery" : newOrder.payment_method.toUpperCase()
      });
      saveUserProfile(profile);

      // Save to Supabase if available
      if (window.supabase) {
        window.supabase
          .from("orders")
          .insert([{
            id: newOrder.id,
            customer_name: newOrder.customer_name,
            phone: newOrder.phone,
            address: newOrder.address,
            city: newOrder.city,
            order_type: newOrder.order_type || "delivery",
            payment_method: newOrder.payment_method,
            order_status: "pending",
            subtotal: newOrder.subtotal,
            delivery_fee: newOrder.delivery_fee,
            total: newOrder.total,
            notes: newOrder.notes || ""
          }])
          .then(({ error }) => {
            if (error) console.warn("Supabase order insert note:", error.message);
          });
      }

      window.dispatchEvent(new CustomEvent("veloura-order-created", { detail: { order: newOrder, pointsEarned } }));
      return newOrder;
    },

    // Create reservation
    createReservation(resData) {
      const resId = `RES-${Math.floor(100 + Math.random() * 900)}`;
      const newRes = {
        id: resId,
        created_at: new Date().toISOString(),
        status: "pending",
        ...resData
      };

      const reservations = getReservations();
      reservations.unshift(newRes);
      saveReservations(reservations);

      if (window.supabase) {
        window.supabase
          .from("reservations")
          .insert([newRes])
          .then(({ error }) => {
            if (error) console.warn("Supabase reservation insert note:", error.message);
          });
      }

      window.dispatchEvent(new CustomEvent("veloura-reservation-created", { detail: { reservation: newRes } }));
      return newRes;
    },

    // Update order status (used by admin or simulation)
    updateOrderStatus(orderId, newStatus) {
      const orders = getOrders();
      const order = orders.find((o) => o.id === orderId);
      if (order) {
        order.order_status = newStatus;
        saveOrders(orders);
        window.dispatchEvent(new CustomEvent("veloura-order-updated", { detail: { orderId, newStatus } }));
      }
      return order;
    },

    // Update reservation status
    updateReservationStatus(resId, newStatus) {
      const reservations = getReservations();
      const res = reservations.find((r) => r.id === resId);
      if (res) {
        res.status = newStatus;
        saveReservations(reservations);
        window.dispatchEvent(new CustomEvent("veloura-reservation-updated", { detail: { resId, newStatus } }));
      }
      return res;
    }
  };
})();
