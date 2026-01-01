export async function fetchChartsData() {
  try {
    const response = await fetch('/api/charts');
    if (!response.ok) {
      throw new Error('Failed to fetch charts data');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching charts data:', error);
    return {
      salesData: [],
      stockData: [],
      revenueData: []
    };
  }
}
