const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
app.use(cors()); // Дозвіл запитів з фронтенду
app.use(express.json());

const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);
const dbName = 'airsoft_config_db';

// 1. GET-ендпоінт: Віддає координати для 3d_tuning.js
app.get('/api/config/:gunId', async (req, res) => {
    try {
        await client.connect();
        const db = client.db(dbName);
        const config = await db.collection('configs').findOne({ gunId: req.params.gunId });
        res.json(config ? config.data : { error: "Not found" });
    } finally {
        await client.close();
    }
});

// 2. POST-ендпоінт: Зберігає налаштовані тобою координати (Enter у Debug-режимі)
app.post('/api/config/save', async (req, res) => {
    const { gunId, configData } = req.body;
    try {
        await client.connect();
        const db = client.db(dbName);
        // Оновлюємо наявні координати або створюємо нові
        await db.collection('configs').updateOne(
            { gunId: gunId },
            { $set: { data: configData } },
            { upsert: true }
        );
        res.json({ message: "Координати успішно синхронізовано з MongoDB!" });
    } finally {
        await client.close();
    }
});

app.listen(3000, () => console.log('API Server running on port 3000'));