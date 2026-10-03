import { DataHandling } from './DataHandling';
import { FinePrint } from './FinePrint';
import { SiteFooter } from './SiteFooter';

export default function Page() {
  return <FinePrint about={<DataHandling />} footer={<SiteFooter />} />;
}
