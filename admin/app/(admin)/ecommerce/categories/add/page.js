import { PageSubTitle } from "@/components/PageTitle";
import CategoryForm from "../CategoryForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const Page = () => {
  return ( // Added return here
    <div>
      <PageSubTitle title="Category - Add">
        <Link href="/categories">
          <Button className="text-nowrap" variant="primary">
            View All
          </Button>
        </Link>
      </PageSubTitle>
      <CategoryForm record={[]} />
    </div>
  );
};

export default Page;
