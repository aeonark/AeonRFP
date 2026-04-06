const QDRANT_URL = "https://11d3fb8f-c48c-4f3a-abba-e3f45fc2dd90.sa-east-1-0.aws.cloud.qdrant.io";
const QDRANT_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIiwic3ViamVjdCI6ImFwaS1rZXk6OWQ3NmQ5NjYtYzA1OC00ZTA3LWJmYWYtNzc3NjUyNDFmNWMxIn0.KOFco9pxemXo8PrscnOzJT_koeRA8wm3QDho5kZR56E";

async function testQdrant() {
    try {
        console.log(`Connecting to Qdrant at: ${QDRANT_URL}`);
        
        let response = await fetch(`${QDRANT_URL}/collections`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'api-key': QDRANT_API_KEY
            }
        });

        if (!response.ok) {
            console.error(`Request failed with status: ${response.status} ${response.statusText}`);
            const body = await response.text();
            console.log("Error body:", body);
        } else {
            console.log("SUCCESS! Connection established.");
            const data = await response.json();
            console.log("Collections:", JSON.stringify(data, null, 2));
        }

    } catch (e) {
        console.error("Test script encountered an error:", e);
    }
}

testQdrant();
