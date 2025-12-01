"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, X, Filter } from "lucide-react";
// import { Card, CardContent } from "./ui/card";
// import SegmentedControl from "./FormFields/SegmentedControl/SegmentedControl";
import Image from "next/image";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import SegmentedControl from "@/components/FormFields/SegmentedControl/SegmentedControl";
import { Card, CardContent } from "@/components/ui/card";
// import { POST, POST_JSON } from "@/actions/actions";
// import { endpoints } from "@/utils/endpoints";

export default function Calendar() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const calendarRef = useRef(null);
  const [view, setView] = useState("timeGridWeek");
  const [currentTitle, setCurrentTitle] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDetailsVisible, setIsDetailsVisible] = useState(isDesktop);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(),
    end: new Date(new Date().setDate(new Date().getDate() + 7)),
  });
  // Fetch events when filter or date range changes
  // useEffect(() => {
  //   const fetchEvents = async () => {
  //     try {
  //       setLoading(true);
  //       const payload = {
  //         mode: filter,
  //         start_date: dateRange.start.toISOString(),
  //         end_date: dateRange.end.toISOString(),
  //       };

  //       const response = await POST_JSON(endpoints.calendar.get, payload);

  //       if (response?.data) {
  //         setEvents(
  //           response.data.flatMap((event) => [
  //             {
  //               title: `Car Pickup`,
  //               start: event?.pickup_date_time,
  //               extendedProps: {
  //                 ...event,
  //                 type: "pickup",
  //                 bgColor: "#C4E6F8",
  //               },
  //             },
  //             {
  //               title: `Car Return`,
  //               start: event?.return_date_time,
  //               extendedProps: {
  //                 ...event,
  //                 type: "return",
  //                 bgColor: "#D8FFE9",
  //               },
  //             },
  //           ])
  //         );
  //       }
  //     } catch (error) {
  //       console.error("Error fetching events:", error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchEvents();
  // }, [filter, dateRange]);

  // Set initial view based on screen size
  useEffect(() => {
    setView(isDesktop ? "timeGridWeek" : "listWeek");
  }, [isDesktop]);

  const handleEventClick = (clickInfo) => {
    setSelectedEvent({
      ...clickInfo.event.toPlainObject(),
      extendedProps: clickInfo.event.extendedProps,
    });
    setIsDetailsVisible(true);
  };

  const handleCloseDetails = () => {
    setIsDetailsVisible(false);
    setTimeout(() => setSelectedEvent(null), 300);
  };

  const handleViewChange = (val) => {
    setView(val);
    calendarRef.current?.getApi().changeView(val);
    setCurrentTitle(calendarRef.current?.getApi().view?.title);
  };

  const handleToday = () => {
    const calendarApi = calendarRef.current?.getApi();
    calendarApi.today();
    setCurrentTitle(calendarApi.view?.title);
    setDateRange({
      start: calendarApi.view.activeStart,
      end: calendarApi.view.activeEnd,
    });
  };

  const handlePrev = () => {
    const calendarApi = calendarRef.current?.getApi();
    calendarApi.prev();
    setCurrentTitle(calendarApi.view?.title);
    setDateRange({
      start: calendarApi.view.activeStart,
      end: calendarApi.view.activeEnd,
    });
  };

  const handleNext = () => {
    const calendarApi = calendarRef.current?.getApi();
    calendarApi.next();
    setCurrentTitle(calendarApi.view?.title);
    setDateRange({
      start: calendarApi.view.activeStart,
      end: calendarApi.view.activeEnd,
    });
  };

  const handleDatesSet = (arg) => {
    setCurrentTitle(arg.view.title);
    setDateRange({
      start: arg.start,
      end: arg.end,
    });
  };

  const filteredEvents = useMemo(() => {
    if (filter === "all") return events;
    return events.filter(
      (event) => event.extendedProps.type.toLowerCase() === filter.toLowerCase()
    );
  }, [events, filter]);

  const renderHeader = () => (
    <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={handleToday}>
          Today
        </Button>
        <Button variant="outline" size="icon" onClick={handlePrev}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleNext}>
          <ChevronRight className="w-4 h-4" />
        </Button>
        <h2 className="text-lg font-semibold ml-2">{currentTitle}</h2>
      </div>

      {isDesktop ? (
        <div className="flex gap-2 items-center">
          <SegmentedControl
            name="group-1"
            callback={(val) => setFilter(val)}
            controlRef={useRef()}
            segments={[
              { label: "All", value: "all", ref: useRef() },
              { label: "Handover", value: "handover", ref: useRef() },
              { label: "Return", value: "return", ref: useRef() },
            ]}
          />
          <Select value={view} onValueChange={handleViewChange}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dayGridMonth">Monthly</SelectItem>
              <SelectItem value="timeGridWeek">Weekly</SelectItem>
              <SelectItem value="timeGridDay">Day</SelectItem>
              <SelectItem value="listWeek">Agenda</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : (
        <Drawer open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
          <DrawerTrigger asChild>
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="p-4">
            <div className="flex flex-col gap-4">
              <SegmentedControl
                name="mobile-group-1"
                callback={(val) => {
                  setFilter(val);
                  setMobileFiltersOpen(false);
                }}
                controlRef={useRef()}
                segments={[
                  { label: "All", value: "all", ref: useRef() },
                  { label: "Pickup", value: "pickup", ref: useRef() },
                  { label: "Return", value: "return", ref: useRef() },
                ]}
              />
              <Select
                value={view}
                onValueChange={(val) => {
                  handleViewChange(val);
                  setMobileFiltersOpen(false);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="View" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dayGridMonth">Monthly</SelectItem>
                  <SelectItem value="timeGridWeek">Weekly</SelectItem>
                  <SelectItem value="timeGridDay">Day</SelectItem>
                  <SelectItem value="listWeek">Agenda</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      <Card className="grow overflow-hidden bg-[#F9FCFF] shadow-none border-0">
        <CardContent className="px-0 h-full">
          <div className="h-full flex flex-col">
            {renderHeader()}

            <div className="px-4 py-2 bg-[#F6F9FB] flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-sm bg-[#C4E6F8]"></span>
                <span>Pickup</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-sm bg-[#D8FFE9]"></span>
                <span>Return</span>
              </div>
            </div>

            <div className={`${!loading && "flex-grow"}`}>
              {loading && (
                <div className="absolute inset-0 z-50 bg-white bg-opacity-50 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              <FullCalendar
                // timeZone="en-US"
                ref={calendarRef}
                plugins={[
                  dayGridPlugin,
                  timeGridPlugin,
                  interactionPlugin,
                  listPlugin,
                ]}
                initialView={view}
                events={filteredEvents}
                headerToolbar={false}
                allDaySlot={false}
                slotDuration="01:00:00"
                height="auto"
                datesSet={handleDatesSet}
                eventContent={renderCustomEvent}
                dayHeaderContent={
                  isDesktop
                    ? (arg) => (
                        <div className="text-center py-2">
                          <div className="font-semibold text-base">
                            {arg.date.toLocaleString("en-US", {
                              weekday: "short",
                            })}
                          </div>
                          <div className="text-xs font-medium">
                            {arg.date.getDate()}
                          </div>
                        </div>
                      )
                    : null
                }
                slotLabelContent={
                  isDesktop
                    ? (arg) => (
                        <span className="text-xs text-gray-500">
                          {arg.text.replace(/\s/g, "")}
                        </span>
                      )
                    : null
                }
                dayHeaderDidMount={
                  isDesktop
                    ? (info) => {
                        const today = new Date();
                        const cellDate = info.date;
                        const isToday =
                          cellDate.getDate() === today.getDate() &&
                          cellDate.getMonth() === today.getMonth() &&
                          cellDate.getFullYear() === today.getFullYear();

                        if (isToday) {
                          const el = info.el.querySelector(
                            ".fc-col-header-cell-cushion"
                          );
                          if (el) {
                            el.style.backgroundColor = "#2563eb";
                            el.style.color = "white";
                            el.style.borderRadius = "4px";
                            el.style.padding = "4px";
                            el.style.height = "auto";
                          }
                        }
                      }
                    : null
                }
                eventOverlap={true}
                eventMaxStack={3}
                eventOrderStrict={true}
                eventOrder="start,-duration,title"
                eventClick={handleEventClick}
                loading={(isLoading) => setLoading(isLoading)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event Details Panel */}
      {isDesktop ? (
        <Card
          className={`transition-all duration-300 ease-in-out ${
            isDetailsVisible ? "w-80" : "w-0 hidden"
          }`}
        >
          <CardContent className="h-full flex flex-col">
            <EventDetails
              selectedEvent={selectedEvent}
              onClose={handleCloseDetails}
            />
          </CardContent>
        </Card>
      ) : (
        <Drawer open={isDetailsVisible} onOpenChange={setIsDetailsVisible}>
          <DrawerContent className="h-[80%]">
            <div className="p-4 h-full overflow-y-auto">
              <EventDetails
                selectedEvent={selectedEvent}
                onClose={handleCloseDetails}
              />
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
}

const EventDetails = ({ selectedEvent, onClose }) => {
  if (!selectedEvent) return null;

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-gray-800 font-medium">Schedule Detail</h2>
        <X className="w-5 h-5 cursor-pointer" onClick={onClose} />
      </div>

      <div className="mb-6">
        <p className="text-xs text-gray-400">Agenda</p>
        <p className="text-base text-primary font-semibold">
          {selectedEvent.title}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          {new Date(selectedEvent.start).toLocaleString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })}
        </p>
      </div>

      <ClientInfoCard data={selectedEvent?.extendedProps} />
      <CarInfoCard data={selectedEvent?.extendedProps?.vehicle_details} />
    </>
  );
};

function renderCustomEvent(eventInfo) {
  const { event, timeText } = eventInfo;
  const { title, extendedProps } = event;
  const {
    type,
    client_name,
    client_profile_image,
    bgColor = "bg-blue-100",
  } = extendedProps;

  return (
    <div
      className={`rounded-md px-3 py-2 ${bgColor} shadow-sm transition-all duration-300 relative group`}
      style={{
        backgroundColor: bgColor,
        borderRadius: "8px",
        padding: "0.5rem",
        boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
        transition: "all 0.3s ease",
      }}
    >
      <div className="text-xs text-gray-600">{timeText}</div>
      <div className={`font-medium text-sm text-primary`}>{title}</div>

      <div className="flex items-center mt-1 gap-2">
        <div className="rounded-full overflow-hidden h-8 w-8">
          <Image
            src={client_profile_image || "/user.jpg"}
            alt={client_name || "User"}
            width={120}
            height={120}
            className="w-full h-full object-cover"
            priority
          />
        </div>
        <span className="text-sm text-gray-700">{client_name}</span>
      </div>

      {/* Bring to front on hover */}
      <style jsx>{`
        .group:hover {
          z-index: 10 !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transform: scale(1.03);
        }
      `}</style>
    </div>
  );
}

const ClientInfoCard = ({ data }) => {
  if (!data) return null;

  return (
    <div className="bg-muted rounded-xl p-4 mb-6">
      <div className="flex flex-col items-center gap-2">
        <div className="rounded-full overflow-hidden h-20 w-20">
          <Image
            src={data.client_profile_image || "/user.jpg"}
            alt={data.client_name || "Customer"}
            width={350}
            height={175}
            className="w-full h-full object-cover"
          />
        </div>
        <p className="text-base font-medium text-primary">{data.client_name}</p>
        <p className="text-sm text-gray-500">{data.client_email}</p>
      </div>

      <hr className="my-3 border-gray-300" />

      <div className="space-y-2 text-gray-600">
        <ClientInfoRow label="Pickup Location" value={data.pickup_location} />
        <ClientInfoRow
          label="Drop-off Location"
          value={data.drop_off_location}
        />
        <ClientInfoRow
          label="Pickup Date"
          value={new Date(data.pickup_date_time).toLocaleString()}
        />
        <ClientInfoRow
          label="Return Date"
          value={new Date(data.return_date_time).toLocaleString()}
        />
        <ClientInfoRow
          label="Special Request"
          value={data.special_request || "None"}
          wrap
        />
      </div>
    </div>
  );
};

const CarInfoCard = ({ data }) => {
  if (!data) return null;
  return (
    <div className="bg-muted rounded-xl p-4 flex flex-col gap-2">
      <div className="rounded-md overflow-hidden h-40 w-full">
        <Image
          src={data?.thumbnail?.media_url || "/car.png"} // Replace this with actual car image if available
          alt={data.title_en}
          width={350}
          height={175}
          className="w-full h-full object-cover"
        />
      </div>
      <p className="text-base text-primary font-medium">{data.title_en}</p>
      <div className="mt-2 space-y-2 text-gray-600">
        <CarInfoRow label="Year" value={data.year} />
        <CarInfoRow label="Car Type" value="SUV" />{" "}
        {/* Optional: use body_type_id mapping */}
        <CarInfoRow
          label="Transmission"
          value={data.transmission === 2 ? "Automatic" : "Manual"}
        />
        <CarInfoRow label="Horse Power" value={data.horse_power} />
        <CarInfoRow label="Rental Price" value={`AED ${data.rental_price}`} />
        <CarInfoRow label="Mileage Limit" value={`${data.mileage_limit} km`} />
      </div>
    </div>
  );
};

const ClientInfoRow = ({ label, value, wrap = false }) => (
  <div className="flex">
    <span className="text-xs w-32 text-gray-400">{label}</span>
    <span className={`text-xs text-primary ${wrap ? "" : "truncate"}`}>
      {value}
    </span>
  </div>
);

const CarInfoRow = ({ label, value }) => (
  <div className="flex">
    <span className="text-xs w-32 text-gray-400">{label}</span>
    <span className="text-xs text-primary">{value}</span>
  </div>
);
