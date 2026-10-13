import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { BellIcon } from 'lucide-react';

export function PopoverDemo() {
  const [notifications] = useState([
    { id: 1, title: 'New candidate has arrived! .', time: '1 hour ago' },
    { id: 2, title: 'You have a new message!', time: '1 hour ago' },
    { id: 3, title: 'Tap to know your progression!', time: '2 hours ago' },
  ]);

  const [isChecked, setIsChecked] = useState(true);

  const toggleSwitch = () => {
    setIsChecked(!isChecked);
  };

  const markAllAsRead = () => {
    // Logic for marking all notifications as read
    // console.log('Marked all notifications as read');
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <BellIcon className="w-5 h-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-90">
        {/* Notifications Card */}
        <div className="flex flex-col justify-center items-center bg-white ">
          <div className="mx-auto flex w-full  flex-col justify-center  pt-0 md:h-[unset] max-w-[520px] lg:px-1 xl:pl-0">
            <div className="relative flex w-full flex-col pt-[20px] md:pt-0">
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm mb-5 mr-0 h-min notibar max-w-full pt-4 pb-4 px-6 dark:border-zinc-800 md:mb-0">
                <div>
                  <p className="text-xl font-extrabold text-zinc-950 dark:text-white md:text-2xl">
                    Notifications
                  </p>
                  <p className="mb-2 mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400 md:mt-1 md:text-base">
                    You have {notifications.length} unread messages.
                  </p>
                </div>
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm mb-5 h-min flex items-center max-w-full py-4 px-4 dark:border-zinc-800">
                  <svg
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="w-6 h-6 me-4"
                    height="1em"
                    width="1em"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0M3.124 7.5A8.969 8.969 0 0 1 5.292 3m13.416 0a8.969 8.969 0 0 1 2.168 4.5"
                    />
                  </svg>
                  <div>
                    <p className="text-zinc-950 dark:text-white font-medium mb-1">
                      Push Notifications
                    </p>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium">
                      Send notifications to device.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isChecked ? 'true' : 'false'}
                    data-state={isChecked ? 'checked' : 'unchecked'}
                    value={isChecked ? 'on' : 'off'}
                    onClick={toggleSwitch}
                    className="peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input ms-auto"
                  >
                    <span
                      data-state={isChecked ? 'checked' : 'unchecked'}
                      className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${isChecked ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </button>
                </div>

                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="relative mx-auto flex w-full max-w-full md:pt-[unset] mb-6"
                  >
                    <div className="w-2 h-2 mt-1 me-4 rounded-full bg-blue-500"></div>
                    <div>
                      <p className="text-zinc-950 dark:text-white font-medium mb-1">
                        {notification.title}
                      </p>
                      <p className="text-zinc-500 dark:text-zinc-400 font-medium">
                        {notification.time}
                      </p>
                    </div>
                  </div>
                ))}

                <button
                  onClick={markAllAsRead}
                  className="whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 flex w-full max-w-full mt-6 items-center justify-center rounded-lg px-2 py-2 text-base font-medium"
                >
                  <svg
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="me-2 h-6 w-6"
                    height="1em"
                    width="1em"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Mark all as read
                </button>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
