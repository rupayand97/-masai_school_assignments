const analyzeHygieneData = async () => {
  const url = 'https://ratings.food.gov.uk/api/open-data-files/FHRS529en-GB.json';
  const response = await fetch(url);
  const data = await response.json();
  const establishments = data.establishments;

  const isValidRating = val => /^[0-5]$/.test(val);
  const numericRatings = establishments.filter(e => isValidRating(e.RatingValue));
  const totalBusinesses = establishments.length;

  const averageRating = (
    numericRatings.reduce((sum, e) => sum + Number(e.RatingValue), 0) / numericRatings.length
  ).toFixed(2);

  const ratingsDistribution = establishments.reduce((dist, e) => {
    const rating = e.RatingValue;
    dist[rating] = (dist[rating] || 0) + 1;
    return dist;
  }, {});

  const businessTypeCounts = establishments.reduce((acc, e) => {
    acc[e.BusinessType] = (acc[e.BusinessType] || 0) + 1;
    return acc;
  }, {});

  const topBusinessTypes = Object.entries(businessTypeCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const authorityMap = {};
  establishments.forEach(e => {
    const auth = e.LocalAuthorityName;
    authorityMap[auth] = authorityMap[auth] || [];
    authorityMap[auth].push(e);
  });

  const authorityInsights = Object.fromEntries(
    Object.entries(authorityMap).map(([auth, records]) => {
      const valid = records.filter(e => isValidRating(e.RatingValue));
      const avg = valid.reduce((sum, e) => sum + Number(e.RatingValue), 0) / valid.length;
      const fiveStars = records.filter(e => e.RatingValue === "5").length;
      return [auth, {
        averageRating: Number(avg.toFixed(2)),
        totalBusinesses: records.length,
        fiveStarPercentage: Number(((fiveStars / records.length) * 100).toFixed(1))
      }];
    })
  );

  return {
    totalBusinesses,
    averageRating: Number(averageRating),
    ratingsDistribution,
    topBusinessTypes,
    authorityInsights
  };
};

(async () => {
  const result = await analyzeHygieneData();
  console.log(result);
})();
