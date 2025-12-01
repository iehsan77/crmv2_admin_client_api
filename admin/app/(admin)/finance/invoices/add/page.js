import { PageSubTitle } from "@/components/PageTitle";
import Form from "../relatedFiles/Form";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const Page = () => {

  return ( // Added return here
    <div className="w-full">
      <PageSubTitle title="Invoice - Add">
        <Link href={ADMIN_PATHS?.FINANCE?.INVOICES?.LIST}>
          <Button className="text-nowrap" variant="outline">
            View All
          </Button>
        </Link>
      </PageSubTitle>
      <Form record={[]} />
    </div>
  );
};

export default Page;
