export function SalesLoadingSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-md">
      {/* Add shimmer effect styles */}
      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        .shimmer {
          animation: shimmer 2s infinite linear;
          background: linear-gradient(
            90deg,
            #f3f4f6 0%,
            #e5e7eb 20%,
            #f3f4f6 40%,
            #f3f4f6 100%
          );
          background-size: 1000px 100%;
        }
      `}</style>

      <table className="w-full">
        <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b-2 border-gray-200">
          <tr>
            {[...Array(7)].map((_, i) => (
              <th key={i} className="px-6 py-3">
                <div className="h-4 bg-gray-200 rounded shimmer"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {[...Array(10)].map((_, rowIndex) => (
            <tr
              key={rowIndex}
              className={`${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
              style={{
                animation: `fadeIn 0.3s ease-out ${rowIndex * 0.05}s both`
              }}
            >
              {[...Array(7)].map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-5">
                  <div className={`h-4 rounded shimmer ${
                    colIndex === 0 ? 'w-16' :
                    colIndex === 1 ? 'w-24' :
                    colIndex === 2 ? 'w-32' :
                    colIndex === 3 ? 'w-28' :
                    colIndex === 4 ? 'w-40' :
                    colIndex === 5 ? 'w-20' :
                    'w-16'
                  }`}></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
