import Header from '@/components/ui/header';

interface ResourceSection {
  title: string;
  content: string[];
}

export default function Resources() {
  const journalingBenefits: ResourceSection = {
    title: "Benefits of Journaling",
    content: [
      "Reduces stress and anxiety by providing an emotional outlet",
      "Improves self-awareness and emotional intelligence",
      "Helps track personal growth and patterns over time",
      "Enhances creativity and problem-solving skills",
      "Strengthens memory and comprehension",
      "Boosts mood and overall mental well-being"
    ]
  };

  const journalingTypes: ResourceSection = {
    title: "Types of Journaling",
    content: [
      "Gratitude Journaling - Focus on daily moments of appreciation",
      "Bullet Journaling - Organized tracking of tasks and goals",
      "Stream of Consciousness - Free-flowing thoughts without structure",
      "Reflective Journaling - Analysis of experiences and emotions",
      "Dream Journaling - Recording and analyzing dreams",
      "Prompt-Based Journaling - Guided writing based on specific questions"
    ]
  };

  const tips: ResourceSection = {
    title: "Tips for Effective Journaling",
    content: [
      "Set aside dedicated time each day for journaling",
      "Write without judgment or self-criticism",
      "Be honest and authentic in your entries",
      "Don't worry about perfect grammar or spelling",
      "Try different journaling styles to find what works for you",
      "Review your entries periodically to track your growth"
    ]
  };

  return (
    <div className="min-h-svh" style={{ backgroundColor: '#BAA68E' }}>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-[#1E1E1E] text-4xl font-bold mb-8">Mental Health Resources</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[journalingBenefits, journalingTypes, tips].map((section) => (
            <div 
              key={section.title}
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <h2 className="text-2xl font-semibold mb-4 text-[#5E503F]">
                {section.title}
              </h2>
              <ul className="space-y-3">
                {section.content.map((item, index) => (
                  <li 
                    key={index}
                    className="flex items-start"
                  >
                    <span className="text-[#834D4D] mr-2">•</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-6 text-[#5E503F]">
            Additional Resources
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-medium mb-3 text-[#834D4D]">
                Mental Health Support
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li>National Crisis Line: 988</li>
                <li>Crisis Text Line: Text HOME to 741741</li>
                <li>SAMHSA's National Helpline: 1-800-662-4357</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-medium mb-3 text-[#834D4D]">
                Recommended Reading
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li>"The Artist's Way Morning Pages Journal" by Julia Cameron</li>
                <li>"Writing Down the Bones" by Natalie Goldberg</li>
                <li>"The Self-Discovery Journal" by Hannah Braime</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 