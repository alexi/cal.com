import type { BookingRepository } from "@calcom/features/bookings/repositories/BookingRepository";
import { isRerouting } from "@calcom/lib/bookings/routing/utils";
import type { RoundRobinRescheduleAction } from "@calcom/prisma/enums";

export interface IFilterHostsService {
  bookingRepo: BookingRepository;
}

export class FilterHostsService {
  constructor(public readonly dependencies: IFilterHostsService) {}

  async filterHostsBySameRoundRobinHost<
    T extends {
      isFixed: false;
      user: { id: number; email: string };
    },
  >({
    hosts,
    rescheduleUid,
    rescheduleWithSameRoundRobinHost,
    routedTeamMemberIds,
  }: {
    hosts: T[];
    rescheduleUid: string | null;
    rescheduleWithSameRoundRobinHost: boolean;
    routedTeamMemberIds: number[] | null;
  }) {
    if (
      !rescheduleUid ||
      !rescheduleWithSameRoundRobinHost ||
      isRerouting({ rescheduleUid, routedTeamMemberIds })
    ) {
      return hosts;
    }

    return this._filterToOriginalHosts({ hosts, rescheduleUid });
  }

  private async _filterToOriginalHosts<
    T extends {
      isFixed: false;
      user: { id: number; email: string };
    },
  >({ hosts, rescheduleUid }: { hosts: T[]; rescheduleUid: string }) {
    const originalRescheduledBooking =
      await this.dependencies.bookingRepo.findOriginalRescheduledBookingUserId({
        rescheduleUid,
      });

    if (!originalRescheduledBooking) {
      return hosts;
    }

    const attendeeEmails = originalRescheduledBooking.attendees?.map((attendee) => attendee.email) || [];

    return hosts.filter((host) => {
      const isOrganizer = host.user.id === originalRescheduledBooking.userId;
      const isAttendee = attendeeEmails.includes(host.user.email);
      return isOrganizer || isAttendee;
    });
  }

  resolveRescheduleWithSameHost({
    roundRobinRescheduleAction,
    rescheduleWithSameRoundRobinHost,
    attendeeRescheduleWithSameHost,
  }: {
    roundRobinRescheduleAction: RoundRobinRescheduleAction;
    rescheduleWithSameRoundRobinHost: boolean;
    attendeeRescheduleWithSameHost?: boolean | null;
  }): boolean {
    switch (roundRobinRescheduleAction) {
      case "RESCHEDULE_WITH_SAME_HOST":
        return true;
      case "RESCHEDULE_WITH_ANY_HOST":
        return false;
      case "ATTENDEE_DECIDES":
        return attendeeRescheduleWithSameHost ?? false;
      default:
        return rescheduleWithSameRoundRobinHost;
    }
  }
}
