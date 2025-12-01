import { PageSubTitle } from "@/components/PageTitle";
import Form from "../relatedFiles/Form";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const Page = () => {
  return (
    // Added return here
    <>
      <PageSubTitle title="Sale Order - Add">
        <Link href="/orders">
          <Button className="text-nowrap" variant="primary">
            View All
          </Button>
        </Link>
      </PageSubTitle>
      <div className="content-container">
        <Form record={[]} />
      </div>
    </>
  );
};

export default Page;
