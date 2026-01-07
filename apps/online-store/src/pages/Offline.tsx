import { Link } from 'react-router-dom';
import { WifiOff, Home, RefreshCw, BookOpen, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Offline() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Offline Icon */}
        <div className="text-center">
          <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <WifiOff className="h-12 w-12 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            You're Offline
          </h1>
          <p className="text-gray-600">
            It looks like you've lost your internet connection. Don't worry, you can still browse some content that's been saved for offline viewing.
          </p>
        </div>

        {/* Offline Features */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Available Offline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Browse Services</p>
                  <p className="text-sm text-gray-600">View our service menu</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <ShoppingBag className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Shop Products</p>
                  <p className="text-sm text-gray-600">Browse our product catalog</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Home className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium">View Gallery</p>
                  <p className="text-sm text-gray-600">See our work and team</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <Button onClick={handleRetry} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          
          <Button variant="outline" asChild className="w-full">
            <Link to="/">
              <Home className="h-4 w-4 mr-2" />
              Go to Homepage
            </Link>
          </Button>
        </div>

        {/* Tips */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h3 className="font-medium text-blue-900 mb-2">Offline Tips</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Check your internet connection</li>
              <li>• Try refreshing the page</li>
              <li>• Some features require internet access</li>
              <li>• Your data is saved locally for offline viewing</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}




