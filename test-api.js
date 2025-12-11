async function testAPI() {
  try {
    const response = await fetch('http://localhost:3000/api/products');
    if (response.ok) {
      const data = await response.json();
      console.log('Produtos retornados:', data.length);
      console.log('Primeiro produto:', data[0]);
    } else {
      console.error('Erro na API:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Erro de rede:', error);
  }
}

testAPI();