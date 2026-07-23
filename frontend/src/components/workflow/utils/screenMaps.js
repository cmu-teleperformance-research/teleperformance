import FlightLookup from "../flight/Lookup";
import Flight from "../flight/Flight";
import Rebook from "../flight/Rebook";
import FlightPolicy from "../flight/Policy";
import FlightApply from "../flight/Apply";
import FlightCommunicate from "../flight/Communicate";

import BaggageLookup from "../baggage/Lookup";
import Claim from "../baggage/Claim";
import Trace from "../baggage/Trace";
import BaggagePolicy from "../baggage/Policy";
import BaggageApply from "../baggage/Apply";
import BaggageCommunicate from "../baggage/Communicate";

import BookLookup from "../book/Lookup";
import BookFlights from "../book/Flights";
import BookSeats from "../book/Seats";
import BookExtras from "../book/Extras";
import BookFare from "../book/Fare";
import BookApply from "../book/Apply";
import BookCommunicate from "../book/Communicate";

import PackageLookup from "../package/Lookup";
import PackageOrder from "../package/Order";
import PackageTracking from "../package/Tracking";
import PackageInvestigation from "../package/Investigation";
import PackageResolution from "../package/Resolution";
import PackageFinalize from "../package/Finalize";
import PackageCommunicate from "../package/Communicate";

import LoanLookup from "../loan/Lookup";
import LoanDetails from "../loan/Details";
import LoanStatus from "../loan/Status";
import LoanPolicy from "../loan/Policy";
import LoanApply from "../loan/Apply";
import LoanCommunicate from "../loan/Communicate";

import RefundLookup from "../refund/Lookup";
import RefundDetails from "../refund/Details";
import RefundStatus from "../refund/Status";
import RefundPolicy from "../refund/Policy";
import RefundApply from "../refund/Apply";
import RefundCommunicate from "../refund/Communicate";

export const screenMap = {
  flight_cancellation: [FlightLookup, Flight, Rebook, FlightPolicy, FlightApply, FlightCommunicate],
  baggage_delay: [BaggageLookup, Claim, Trace, BaggagePolicy, BaggageApply, BaggageCommunicate],
  book_flight: [BookLookup, BookFlights, BookSeats, BookExtras, BookFare, BookApply, BookCommunicate],
  package_never_arrived: [PackageLookup, PackageOrder, PackageTracking, PackageInvestigation, PackageResolution, PackageFinalize, PackageCommunicate],
  loan_delay: [LoanLookup, LoanDetails, LoanStatus, LoanPolicy, LoanApply, LoanCommunicate],
  refund_request: [RefundLookup, RefundDetails, RefundStatus, RefundPolicy, RefundApply, RefundCommunicate],
};
