const webhookUrl = 'https://emailwebhook-xo4zljy57a-uc.a.run.app';
const webhookKey = 'sandbox_key_temporal';

async function runTest(intento) {
    console.log(`\n🚀 Lanzando Intento ${intento}...`);
    const formData = new FormData();
    formData.append('from', 'Director Test <director_test@breederhub.store>');
    formData.append('subject', 'Documento Confidencial - CMD-018');
    
    // Simulamos un archivo PDF adjunto
    const pdfContent = new Blob(['%PDF-1.4 contenido simulado para forzar un hash estatico'], { type: 'application/pdf' });
    formData.append('file1', pdfContent, 'reporte_secreto.pdf');

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'x-webhook-key': webhookKey },
            body: formData
        });
        
        if (!response.ok) {
            const text = await response.text();
            console.log('🔴 STATUS:', response.status);
            console.log('🔴 BODY:', text.substring(0, 150).replace(/\n/g, ' '));
            return;
        }
        
        const data = await response.json();
        console.log('🟢 STATUS:', response.status);
        console.log('🟢 RESPONSE:', data);
    } catch(e) {
        console.error('🔴 ERROR CRÍTICO:', e.message);
    }
}

async function main() {
    await runTest(1); // Crea cliente y documento
    await new Promise(r => setTimeout(r, 2000)); // Espera 2 segundos
    await runTest(2); // Debería procesar, pero Firestore fusionará (deduplicación)
}

main();