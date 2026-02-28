require('dotenv').config()
const axios = require('axios');

async function main() {
    try {
        const res = await axios.post('https://api.firecrawl.dev/v1/extract', {
            urls: [
              'https://udb.moe.edu.tw/ulist/Department?institution_id=000021E66D07&institution_name=%E5%9C%8B%E7%AB%8B%E6%94%BF%E6%B2%BB%E5%A4%A7%E5%AD%B8&division_id=000021E66E3C'
            ],
            prompt: "Extract the core overview or mission of this academic program concisely (under 30 characters). Also find the URL for their curriculum/courses if present. Lastly, identify up to 10 key research areas or topics covered by this department.",
            schema: {
                type: "object",
                properties: {
                    program_overview: {
                        type: "string",
                        description: "A concise 30-character summary of the program's academic mission or focus in traditional Chinese."
                    }
                },
                required: ["program_overview"]
            }
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`
            }
        });

        console.log(JSON.stringify(res.data, null, 2));
    } catch(err) {
        console.error("Error payload:", err.response?.data || err.message);
    }
}

main().catch(console.error);
