use strict;
use warnings;
use open ':std', ':encoding(UTF-8)';
use Scalar::Util qw(looks_like_number);

my $filename = $ARGV[0];

open(my $fh, '<:encoding(UTF-8)', $filename)
  or die "Could not open file '$filename' $!";

my $size = 0;
my $num = 1;
while (my $row = <$fh>) {
    chomp $row;
    if ($size == 0 && looks_like_number($row)) {
    	print "$num\n";
	$num++;
    } else {
	print "$row\n";
    }
    $size = length($row);
}

