import { promises as fs } from 'fs';
import path from 'path';
import Link from 'next/link';

// Helper function to read the metadata.json file in a PoC directory
async function getPoCMetadata(dirPath: string) {
  const metadataPath = path.join(dirPath, 'metadata.json');
  
  try {
    const metadata = await fs.readFile(metadataPath, 'utf-8');
    return JSON.parse(metadata);
  } catch (error) {
    // Handle errors such as missing metadata file
    return { title: dirPath.split('/').pop(), description: "No description available" };
  }
}

export default async function UnderwritingPage() {
  // Path to the underwriting directory
  const underwritingDir = path.join(process.cwd(), 'src', 'app', 'pocs', 'underwriting');

  // Get the list of files/folders in the underwriting directory
  const items = await fs.readdir(underwritingDir);

  // Filter out files and keep only directories (assuming each PoC is a directory)
  const directories = items.filter((item) => !item.includes('.'));

  // Read metadata for each directory (PoC)
  const poCs = await Promise.all(directories.map(async (directory) => {
    const dirPath = path.join(underwritingDir, directory);
    const metadata = await getPoCMetadata(dirPath);
    return {
      directory,
      title: metadata.title || directory,
      description: metadata.description || "No description available"
    };
  }));

  return (
    <div className="min-h-screen bg-light-gray relative">
      {/* Header section with pattern background */}
      <section className="relative bg-white py-12 mb-8">
        <div className="absolute inset-0 pattern-circuit opacity-[0.03]"></div>
        <div className="container max-w-ultra mx-auto px-6 relative z-10">
          <h1 className="text-4xl font-bold mb-4 text-gradient">Underwriting PoCs</h1>
          <p className="text-medium-gray max-w-3xl mb-8">
            Explore innovative solutions for insurance underwriting processes.
          </p>
        </div>
      </section>

      {/* PoCs section */}
      <div className="container max-w-ultra mx-auto px-0 pb-6">
        {/* Data points decoration */}
        <div className="data-points">
          {[...Array(10)].map((_, i) => (
            <div 
              key={i}
              className="data-point"
              style={{
                zIndex: 100,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            ></div>
          ))}
        </div>
        
        <div className="md:md:ai-card ai-card-mobile">
          <div className="p-6 bg-white rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {poCs.map(({ directory, title, description }) => (
                <div key={directory} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-normal border-t-2 border-gradient overflow-hidden">
                  <Link href={`/pocs/underwriting/${directory}`} className="block p-6">
                    <h2 className="text-lg font-bold text-primary mb-2">{title}</h2>
                    <p className="text-medium-gray text-sm">{description}</p>
                    <div className="mt-4 flex justify-end">
                      <span className="text-primary flex items-center text-sm font-medium">
                        Explore
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {poCs.length === 0 && (
          <div className="glass-card text-center py-16">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-medium text-medium-gray mb-2">
              No PoCs available in this category.
            </h3>
          </div>
        )}
      </div>
    </div>
  );
}
