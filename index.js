const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Base URL for blockchain API
const BLOCKCHAIR_API = 'https://api.blockchair.com/bitcoin-cash';

// Helper function to fetch data from API
async function fetchFromAPI(endpoint) {
    try {
        const response = await axios.get(`${BLOCKCHAIR_API}${endpoint}`);
        return response.data;
    } catch (error) {
        console.error('API Error:', error.message);
        throw error;
    }
}

// Home route
app.get('/', async (req, res) => {
    try {
        // Get blockchain stats
        const statsData = await fetchFromAPI('/stats');
        const stats = statsData.data;
        
        res.render('index', { 
            stats: stats,
            error: null 
        });
    } catch (error) {
        res.render('index', { 
            stats: null,
            error: 'Error al cargar las estadísticas de la blockchain' 
        });
    }
});

// Search route
app.post('/search', async (req, res) => {
    const { query } = req.body;
    
    if (!query) {
        return res.redirect('/');
    }
    
    try {
        // Try to determine what type of query this is
        // Block hash (64 chars) or block height (numeric)
        if (/^\d+$/.test(query)) {
            // Block height
            return res.redirect(`/block/${query}`);
        } else if (query.length === 64) {
            // Could be block hash or transaction hash
            // Try block first
            return res.redirect(`/block/${query}`);
        } else {
            // Assume it's an address
            return res.redirect(`/address/${query}`);
        }
    } catch (error) {
        res.render('error', { 
            error: 'No se pudo encontrar el bloque, transacción o dirección',
            query: query 
        });
    }
});

// Block route
app.get('/block/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const blockData = await fetchFromAPI(`/dashboards/block/${id}`);
        const block = blockData.data[id];
        
        if (!block) {
            return res.render('error', { 
                error: 'Bloque no encontrado',
                query: id 
            });
        }
        
        res.render('block', { 
            block: block.block,
            transactions: block.transactions,
            error: null 
        });
    } catch (error) {
        res.render('error', { 
            error: 'Error al cargar el bloque',
            query: id 
        });
    }
});

// Transaction route
app.get('/transaction/:hash', async (req, res) => {
    const { hash } = req.params;
    
    try {
        const txData = await fetchFromAPI(`/dashboards/transaction/${hash}`);
        const transaction = txData.data[hash];
        
        if (!transaction) {
            return res.render('error', { 
                error: 'Transacción no encontrada',
                query: hash 
            });
        }
        
        res.render('transaction', { 
            transaction: transaction.transaction,
            inputs: transaction.inputs,
            outputs: transaction.outputs,
            error: null 
        });
    } catch (error) {
        res.render('error', { 
            error: 'Error al cargar la transacción',
            query: hash 
        });
    }
});

// Address route
app.get('/address/:address', async (req, res) => {
    const { address } = req.params;
    
    try {
        const addressData = await fetchFromAPI(`/dashboards/address/${address}`);
        const addrInfo = addressData.data[address];
        
        if (!addrInfo) {
            return res.render('error', { 
                error: 'Dirección no encontrada',
                query: address 
            });
        }
        
        res.render('address', { 
            address: addrInfo.address,
            transactions: addrInfo.transactions,
            error: null 
        });
    } catch (error) {
        res.render('error', { 
            error: 'Error al cargar la dirección',
            query: address 
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Explorador BCH ejecutándose en http://localhost:${PORT}`);
});
