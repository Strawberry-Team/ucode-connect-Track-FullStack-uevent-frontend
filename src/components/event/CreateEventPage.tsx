import {useState, FormEvent, useEffect} from "react";
import {useDispatch, useSelector} from "react-redux";
import {createEvent, updateEvent} from "@/components/redux/actions/eventActions";
import {RootState} from "@/components/redux/store";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Button} from "@/components/ui/button";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Card, CardContent} from "@/components/ui/card";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Calendar} from "@/components/ui/calendar";
import {format} from "date-fns";
import {
    BellRing,
    BookmarkCheck,
    BriefcaseBusiness,
    CalendarFold,
    CalendarIcon,
    ClockIcon, Palette,
    Sofa,
    Video,
} from "lucide-react";
import {ScrollArea} from "@/components/ui/scroll-area";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {UiMessages} from "@/constants/uiMessages.ts";
import {getUsers} from "@/components/redux/actions/userActions.ts";
import {showErrorToasts, showSuccessToast} from "@/components/utils/ToastNotifications.tsx";
import {ToastStatusMessages} from "@/constants/toastStatusMessages.ts";
import {Toggle} from "@/components/ui/toggle.tsx";
import {useNavigate} from "react-router-dom";
import {useEventDraft} from "@/components/utils/EventDraftContext.tsx";
import {CalendarReducer} from "@/components/redux/reducers/calendarReducer.ts";
import {getCalendars} from "@/components/redux/actions/calendarActions.ts";
import UserSelector from "@/components/utils/UserSelector.tsx";

interface User {
    id: number;
    fullName: string;
    email: string;
    profilePicture: string;
    role: "viewer" | "member" | "owner";
    attendanceStatus?: "yes" | "no" | "maybe";
}

const CreateEventPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const {draft, setDraft} = useEventDraft();

    const calendars: CalendarReducer[] = useSelector((state: RootState) => state.calendars.calendars);
    const users = useSelector((state: { users: { users: User[] } }) => state.users.users ?? []);
    const currentUser = useSelector((state: { auth: { user: User } }) => state.auth.user);

    const [openStartCalendar, setOpenStartCalendar] = useState(false);
    const [openEndCalendar, setOpenEndCalendar] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("work");
    const [type, setType] = useState("meeting");
    const [calendarId, setCalendarId] = useState<number | null>(null);
    const [startDate, setStartDate] = useState<Date | undefined>();
    const [startTime, setStartTime] = useState("");
    const [endDate, setEndDate] = useState<Date | undefined>();
    const [endTime, setEndTime] = useState("");
    const [allDay, setAllDay] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
    const [isEditMode, setIsEditMode] = useState(false);
    const [creatorId, setCreatorId] = useState<number | null>(null);
    const [notifyBeforeMinutes, setNotifyBeforeMinutes] = useState<number | undefined>(10);

    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        if (draft?.eventId) {
            setIsEditMode(true);
            setTitle(draft.title || "");
            setDescription(draft.description || "");
            setCategory(draft.category || "work");
            setType(draft.type || "meeting");
            setCalendarId(draft.calendarId || null);
            setStartDate(draft.startDate);
            setEndDate(draft.endDate);
            setStartTime(draft.startTime || "");
            setEndTime(draft.endTime || "");
            setAllDay(draft.startTime === "00:00" && draft.endTime === "23:59");
            setSelectedUsers(
                draft.selectedUsers?.map((user: User) => ({
                    ...user,
                    attendanceStatus: user.attendanceStatus,
                })) || []
            );
            setCreatorId(draft.creatorId || currentUser.id);
            setNotifyBeforeMinutes(draft.notifyBeforeMinutes || 10);
        } else if (draft?.calendarId !== undefined) {
            setIsEditMode(false);
            setTitle(draft.title || "");
            setStartDate(draft.startDate);
            setEndDate(draft.endDate);
            setStartTime(draft.startTime || "");
            setEndTime(draft.endTime || "");
            setType(draft.type || "meeting");
            setCalendarId(draft.calendarId || null);
            setSelectedUsers(draft.selectedUsers || []);
            setCreatorId(currentUser.id);
            setNotifyBeforeMinutes(10);
        } else if (calendars.length > 0 && calendarId === null) {
            setIsEditMode(false);
            const mainCalendar = calendars.find((calendar) => calendar.type === "main");
            if (mainCalendar) {
                setCalendarId(mainCalendar.id);
            } else {
                setCalendarId(calendars[0]?.id || null);
            }
            setCreatorId(currentUser.id);
            setNotifyBeforeMinutes(10);

            const now = new Date();
            const currentHour = now.getHours();
            const currentMinutes = now.getMinutes();

            const startHour = currentMinutes > 0 ? currentHour + 1 : currentHour;
            const formattedStartHour = startHour.toString().padStart(2, "0");
            const startTimeValue = `${formattedStartHour}:00`;

            const endHour = (startHour + 1) % 24;
            const formattedEndHour = endHour.toString().padStart(2, "0");
            const endTimeValue = `${formattedEndHour}:00`;

            const startDateValue = new Date(now);
            startDateValue.setHours(startHour, 0, 0, 0)
            const endDateValue = new Date(now);
            endDateValue.setHours(endHour, 0, 0, 0);

            setStartDate(startDateValue);
            setStartTime(startTimeValue);
            setEndDate(endDateValue);
            setEndTime(endTimeValue);
        }
        setIsInitialized(true);
    }, [calendars, draft, currentUser]);

    useEffect(() => {
        (async () => {
            await Promise.all([getUsers(dispatch), getCalendars(dispatch)]);
        })();

        if (
            currentUser &&
            !isEditMode &&
            !draft?.eventId &&
            selectedUsers.length === 0 &&
            !isInitialized
        ) {
            setSelectedUsers([{...currentUser, role: "owner"}]);
        }
    }, [dispatch, currentUser, isEditMode, draft?.eventId]);

    const handleCancel = () => {
        setDraft({});
        navigate("/calendar");
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!startDate || !endDate || calendarId === null) return;

        const formattedStartAt = `${format(startDate, "yyyy-MM-dd")} ${startTime}:00`;
        const formattedEndAt = `${format(endDate, "yyyy-MM-dd")} ${endTime}:00`;

        const payload = {
            title,
            description,
            category,
            type,
            startAt: allDay ? `${formattedStartAt.split(" ")[0]} 00:00:00` : formattedStartAt,
            endAt: allDay ? `${formattedStartAt.split(" ")[0]} 23:59:59` : formattedEndAt,
            calendarId,
            notifyBeforeMinutes,
        };

        setDraft({
            title,
            description,
            category,
            type,
            startDate,
            endDate,
            startTime,
            endTime,
            calendarId,
            selectedUsers,
            notifyBeforeMinutes,
            eventId: isEditMode ? draft.eventId : undefined,
            creatorId: creatorId || currentUser.id,
        });

        let result;
        if (isEditMode && draft?.eventId) {
            result = await updateEvent(
                dispatch,
                parseInt(draft.eventId, 10),
                payload,
                selectedUsers.map(({id}) => ({userId: id}))
            );
        } else {
            result = await createEvent(
                dispatch,
                payload,
                selectedUsers.map(({id}) => ({userId: id}))
            );
        }

        if (result.success) {
            await getCalendars(dispatch);
            navigate("/calendar");
            showSuccessToast(
                isEditMode
                    ? ToastStatusMessages.EVENTS.UPDATE_SUCCESS
                    : ToastStatusMessages.EVENTS.CREATE_SUCCESS
            );
            setDraft({});
        } else {
            showErrorToasts(
                result.errors ||
                (isEditMode
                    ? ToastStatusMessages.EVENTS.UPDATE_FAILED
                    : ToastStatusMessages.EVENTS.CREATE_FAILED)
            );
        }
    };

    const editableCalendars = isEditMode
        ? calendars
        : calendars.filter((calendar) =>
            calendar.participants.some(
                (p) => p.userId === currentUser.id && p.role !== "viewer"
            )
        );

    const timeOptions = Array.from({length: 48}, (_, i) => {
        const h = Math.floor(i / 2).toString().padStart(2, "0");
        const m = (i % 2 === 0 ? "00" : "30").padStart(2, "0");
        return `${h}:${m}`;
    });

    const reminderOptions = [
        {label: "10 minutes", value: 10},
        {label: "30 minutes", value: 30},
        {label: "1 hour", value: 60},
        {label: "1 day", value: 1440},
    ];

    return (
        <div className="max-w-195 mx-auto p-6">
            <Card>
                <CardContent className="space-y-4">
                    <Input
                        placeholder="Add title"
                        className="mt-1"
                        maxLength={50}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />

                    <div className="flex items-center space-x-1">
                        <div className="flex items-center space-x-2">
                            <Popover open={openStartCalendar} onOpenChange={setOpenStartCalendar}>
                                <PopoverTrigger>
                                    <Button variant="outline" className="w-40 font-normal">
                                        <CalendarIcon strokeWidth={3} className="ml-0 h-4 w-4"
                                                      style={{color: "#727272"}}/>
                                        {startDate ? format(startDate, "PPP") : "Start date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent align="start">
                                    <Calendar
                                        mode="single"
                                        selected={startDate}
                                        onSelect={(date) => {
                                            setStartDate(date);
                                            setOpenStartCalendar(false);
                                        }}
                                    />
                                </PopoverContent>
                            </Popover>


                            <Select onValueChange={setStartTime} disabled={allDay} value={startTime}>
                                <SelectTrigger className="w-29 cursor-pointer disabled:cursor-default">
                                    <ClockIcon strokeWidth={3} className="mr-0 h-4 w-4"/>
                                    <SelectValue placeholder="Time"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <ScrollArea className="h-48">
                                        {timeOptions.map((time) => (
                                            <SelectItem className="cursor-pointer" key={time} value={time}>
                                                {time}
                                            </SelectItem>
                                        ))}
                                    </ScrollArea>
                                </SelectContent>
                            </Select>
                        </div>

                        <span className="text-gray-500 mx-2">to</span>

                        <div className="flex items-center space-x-2">
                            <Popover open={openEndCalendar} onOpenChange={setOpenEndCalendar}>
                                <PopoverTrigger className="ms-1">
                                    <Button variant="outline" className="w-40 font-normal">
                                        <CalendarIcon strokeWidth={3} className="ml-0 h-4 w-4"
                                                      style={{color: "#727272"}}/>
                                        {endDate ? format(endDate, "PPP") : "End date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent align="start">
                                    <Calendar
                                        mode="single"
                                        selected={endDate}
                                        onSelect={(date) => {
                                            setEndDate(date);
                                            setOpenEndCalendar(false);
                                        }}
                                    />
                                </PopoverContent>
                            </Popover>

                            <Select onValueChange={setEndTime} disabled={allDay} value={endTime}>
                                <SelectTrigger className="w-29 cursor-pointer disabled:cursor-default">
                                    <ClockIcon strokeWidth={3} className="mr-0 h-4 w-4"/>
                                    <SelectValue placeholder="Time"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <ScrollArea className="h-48">
                                        {timeOptions.map((time) => (
                                            <SelectItem className="cursor-pointer" key={time} value={time}>
                                                {time}
                                            </SelectItem>
                                        ))}
                                    </ScrollArea>
                                </SelectContent>
                            </Select>
                        </div>
                        <Toggle
                            pressed={allDay}
                            onPressedChange={() => setAllDay(!allDay)}
                            className="h-9 px-8 cursor-pointer border"
                        >
                            All day
                        </Toggle>
                    </div>

                    <div className="flex items-center space-x-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Select
                                        onValueChange={(value) => setCalendarId(Number(value))}
                                        value={calendarId?.toString() || ""}
                                        disabled={isEditMode}
                                    >
                                        <SelectTrigger className="cursor-pointer disabled:cursor-default">
                                            <CalendarFold strokeWidth={3}/>
                                            <SelectValue placeholder="Calendar" >
                                                {calendarId
                                                    ? (() => {
                                                        const selectedCalendar = calendars.find(
                                                            (calendar) => calendar.id === calendarId
                                                        );
                                                        if (selectedCalendar) {
                                                            const title = selectedCalendar.title;
                                                            return `${title.slice(0, 20)}${title.length > 20 ? "..." : ""}`;
                                                        }
                                                        return "Calendar";
                                                    })()
                                                    : "Calendar"}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {editableCalendars.map((calendar) => (
                                                <SelectItem className="cursor-pointer" key={calendar.id} value={String(calendar.id)}>
                                                    {calendar.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </TooltipTrigger>
                                <TooltipContent>Calendar</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Select onValueChange={setType} value={type} disabled={isEditMode}>
                                        <SelectTrigger className="cursor-pointer disabled:cursor-default">
                                            <SelectValue placeholder="Выберите тип"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="meeting" className="cursor-pointer">
                                                <Video strokeWidth={3}/>Meeting
                                            </SelectItem>
                                            <SelectItem value="reminder" className="cursor-pointer">
                                                <BellRing strokeWidth={3}/>Reminder
                                            </SelectItem>
                                            <SelectItem value="task" className="cursor-pointer">
                                                <BookmarkCheck strokeWidth={3}/>Task
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </TooltipTrigger>
                                <TooltipContent>Type</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Select onValueChange={setCategory} value={category}>
                                        <SelectTrigger className="cursor-pointer">
                                            <SelectValue/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="work" className="cursor-pointer">
                                                <BriefcaseBusiness strokeWidth={3}/>Work
                                            </SelectItem>
                                            <SelectItem value="home" className="cursor-pointer">
                                                <Sofa strokeWidth={3}/>Home
                                            </SelectItem>
                                            <SelectItem value="hobby" className="cursor-pointer">
                                                <Palette strokeWidth={3}/>Hobby
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </TooltipTrigger>
                                <TooltipContent>Category</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Select
                                        onValueChange={(value) => setNotifyBeforeMinutes(Number(value))}
                                        value={notifyBeforeMinutes?.toString()}
                                    >
                                        <SelectTrigger className="w-auto cursor-pointer">
                                            <BellRing strokeWidth={3} className="mr-2 h-4 w-4"/>
                                            <SelectValue placeholder="Reminder"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {reminderOptions.map((option) => (
                                                <SelectItem className="cursor-pointer" key={option.value} value={option.value.toString()}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </TooltipTrigger>
                                <TooltipContent>Reminder</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>

                    <Textarea
                        placeholder="Description"
                        className="mt-1"
                        maxLength={250}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />

                    <UserSelector
                        users={users}
                        selectedUsers={selectedUsers}
                        setSelectedUsers={setSelectedUsers}
                        showRoleSelector={false}
                        creatorId={creatorId}
                    />

                    <div className="mt-2 flex justify-end space-x-2">
                        <Button variant="outline" onClick={handleCancel}>
                            {UiMessages.GENERAL.CANCEL_BUTTON}
                        </Button>

                        <Button
                            disabled={!(allDay || (startTime && endTime)) || !title || !startDate || !endDate}
                            onClick={handleSubmit}
                        >
                            {isEditMode ? UiMessages.GENERAL.UPDATE_BUTTON : UiMessages.GENERAL.CREATE_BUTTON}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default CreateEventPage;