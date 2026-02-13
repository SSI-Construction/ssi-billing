import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ClientList } from './components/ClientList';
import { ClientForm } from './components/ClientForm';
import { ClientDetail } from './components/ClientDetail';
import { InvoiceList } from './components/InvoiceList';
import { InvoiceEditor } from './components/InvoiceEditor';
import { ServiceTemplates } from './components/ServiceTemplates';
import { Settings } from './components/Settings';
import { Reminders } from './components/Reminders';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="clients" element={<ClientList />} />
          <Route path="clients/new" element={<ClientForm />} />
          <Route path="clients/:id" element={<ClientDetail />} />
          <Route path="clients/:id/edit" element={<ClientForm />} />
          <Route path="invoices" element={<InvoiceList />} />
          <Route path="invoices/:id" element={<InvoiceEditor />} />
          <Route path="services" element={<ServiceTemplates />} />
          <Route path="settings" element={<Settings />} />
          <Route path="reminders" element={<Reminders />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
