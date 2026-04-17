/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import AuraInterface from './components/AuraInterface';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <div className="min-h-screen bg-black">
      <ErrorBoundary componentName="AuraInterface">
        <AuraInterface />
      </ErrorBoundary>
    </div>
  );
}
