import { PageSubTitle } from "@/components/PageTitle";
import ProductForm from "../ProductForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const Page = (record) => {
  return ( // Added return here
    <div>
      <PageSubTitle title="Product - Edit">
        <Link href="/ecommerce/catalog">
          <Button className="text-nowrap" variant="primary">
            View All
          </Button>
        </Link>
      </PageSubTitle>
      <ProductForm record={record} />
    </div>
  );
};

export default Page;
