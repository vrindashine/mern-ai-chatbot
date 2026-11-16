
require("dotenv").config();

async function main(){
    const {GoogleGenAI}= await import("@google/genai")

    const ai = new GoogleGenAI({
        apikey:process.env.GEMINI_API_KEY
    })

    const response = await ai.models.generateContent({
        model:"gemini-3.6-flash",
        contents:"Suggest three laptops for programming under ₹50,000. Return the answer in JSON format."
    })

    console.log(response.text)
}
main().catch((error)=>{
    console.error("Error:",error.message)
});