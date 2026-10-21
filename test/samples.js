// Hand-written samples in the two registers. Not a benchmark: a smoke test
// that the scorer separates obvious cases and refuses short ones.
module.exports = {
  aiStyle: `Most people think leadership is about having all the answers.

It's not. It's about asking better questions.

Last year I watched a junior engineer transform our team's entire approach to incident response. Not because she was the most experienced — she wasn't. Because she wasn't afraid to ask "why do we do it this way?"

Here's what I learned:

✅ Curiosity beats credentials
✅ Psychological safety isn't a buzzword, it's a strategy
✅ The best ideas often come from the newest voices

In today's fast-paced world, the leaders who win aren't the ones who know the most. They're the ones who unlock the potential in everyone around them.

Agree?

#Leadership #Engineering #Growth`,

  humanStyle: `ok so i finally got round to replacing the kafka consumer that's been limping along since 2022 and honestly i don't know why i waited so long. the old one would just... stop. no error, no log line, nothing - just silently stop consuming and you'd find out three hours later when someone asked why the dashboard was flat.

new one is on pekko-connectors, took about a day and a half including the bit where i spent two hours convinced the broker was broken when actually i'd fat-fingered the group id (again). if you're on the akka 2.6 line and dreading the move, it's genuinely not that bad, the API is basically the same.

anyway. three hours of flat dashboards per month, back. small wins!!`,

  short: `Great to see everyone at the summit this week. Thanks to the organisers.`,
};
