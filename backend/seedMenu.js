require('dotenv').config();
const sequelize = require('./db');
const MenuItem = require('./models/MenuItem');

const menuData = [
  {
    category: "SOUPS",
    items: [
      { id: "sp1", name: "Veg Hot and Sour", price: 79, type: "veg" },
      { id: "sp2", name: "Chicken Hot and Sour", price: 119, type: "non-veg" }
    ]
  },
  {
    category: "VEG STARTERS",
    items: [
      { id: "vs1", name: "Veg Manchurian", price: 79, type: "veg" },
      { id: "vs2", name: "Baby Corn Chilly", price: 119, type: "veg" },
      { id: "vs3", name: "Baby Corn Manchurian", price: 119, type: "veg" },
      { id: "vs4", name: "Paneer Chilly", price: 189, type: "veg" },
      { id: "vs5", name: "Paneer 65", price: 189, type: "veg" },
      { id: "vs6", name: "Paneer Manchurian", price: 189, type: "veg" }
    ]
  },
  {
    category: "ROTIS",
    items: [
      { id: "r1", name: "Parota", price: 25, type: "veg" },
      { id: "r2", name: "Chapati", price: 15, type: "veg" }
    ]
  },
  {
    category: "NON-VEG STARTERS",
    items: [
      { id: "ns1", name: "Chilly Chicken", price: 179, type: "non-veg" },
      { id: "ns2", name: "Chicken Manchurian", price: 179, type: "non-veg" },
      { id: "ns3", name: "Chicken 65", price: 179, type: "non-veg" },
      { id: "ns4", name: "Chicken Lollipop", price: 179, type: "non-veg" },
      { id: "ns5", name: "Dragon Chicken", price: 219, type: "non-veg" },
      { id: "ns6", name: "Pepper Chicken", price: 199, type: "non-veg" },
      { id: "ns7", name: "RR Chicken", price: 219, type: "non-veg" },
      { id: "ns8", name: "Chicken Majestic", price: 219, type: "non-veg" },
      { id: "ns9", name: "Chilly Fish", price: 219, type: "non-veg" },
      { id: "ns10", name: "Fish 65", price: 219, type: "non-veg" },
      { id: "ns11", name: "Apollo Fish", price: 219, type: "non-veg" },
      { id: "ns12", name: "Chilly Prawns", price: 229, type: "non-veg" },
      { id: "ns13", name: "Loose Prawns", price: 229, type: "non-veg" }
    ]
  },
  {
    category: "NOODLES",
    items: [
      { id: "n1", name: "Veg Noodles", price: 79, type: "veg" },
      { id: "n2", name: "Egg Noodles", price: 79, type: "non-veg" },
      { id: "n3", name: "Chicken Noodles", price: 99, type: "non-veg" }
    ]
  },
  {
    category: "FRIED RICE",
    items: [
      { id: "fr1", name: "Veg Fried Rice", price: 89, type: "veg" },
      { id: "fr2", name: "Egg Fried Rice", price: 99, type: "non-veg" },
      { id: "fr3", name: "Chicken Fried Rice", price: 149, type: "non-veg" },
      { id: "fr4", name: "Fry Piece Fried Rice", price: 169, type: "non-veg" }
    ]
  },
  {
    category: "EGG ITEMS",
    items: [
      { id: "e1", name: "Chilly Egg", price: 99, type: "non-veg" },
      { id: "e2", name: "Egg Manchurian", price: 99, type: "non-veg" },
      { id: "e3", name: "Egg Bhurji", price: 79, type: "non-veg" },
      { id: "e4", name: "Egg Masala Omelet", price: 39, type: "non-veg" }
    ]
  },
  {
    category: "BIRYANIS",
    items: [
      { id: "b1", name: "Chicken Fry Piece Biryani", price: 189, type: "non-veg" },
      { id: "b2", name: "Chicken Dum Biryani", price: 179, type: "non-veg" },
      { id: "b3", name: "Chicken Mughlai Biryani", price: 219, type: "non-veg" },
      { id: "b4", name: "Chicken Boneless Biryani", price: 219, type: "non-veg" },
      { id: "b5", name: "Chicken Lollipop Biryani", price: 239, type: "non-veg" },
      { id: "b6", name: "Veg Biryani", price: 179, type: "veg" },
      { id: "b7", name: "Paneer Biryani", price: 179, type: "veg" }
    ]
  },
  {
    category: "CURRYS",
    items: [
      { id: "c1", name: "Egg Curry", price: 79, type: "non-veg" },
      { id: "c2", name: "Chicken Curry", price: 119, type: "non-veg" },
      { id: "c3", name: "Paneer Curry", price: 119, type: "veg" }
    ]
  }
];

sequelize.sync()
  .then(async () => {
    console.log('Connected. Clearing old base menu...');
    await MenuItem.destroy({ where: {} });
    
    console.log('Seeding new menu items...');
    for (const cat of menuData) {
      for (const item of cat.items) {
        await MenuItem.create({
          id: item.id,
          name: item.name,
          price: item.price,
          type: item.type,
          category: cat.category
        });
      }
    }
    
    console.log('Seeding complete! You can now start the server.');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
